"""
Repository for managing embedding usage tracking records
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, select
from datetime import datetime, timedelta

from app.models.embedding_usage import EmbeddingUsage
from app.repositories.base_repository import BaseRepository


class EmbeddingUsageRepository(BaseRepository[EmbeddingUsage]):
    """Repository for managing embedding usage tracking records"""
    
    def __init__(self, db: Session):
        super().__init__(db, EmbeddingUsage)
    
    def create_usage_record(
        self,
        provider_id: str,
        workspace_id: str,
        created_by: str,
        model_used: str,
        tokens_processed: int,
        latency_ms: Optional[int] = None,
        success: bool = True,
        request_type: Optional[str] = None,
        source_type: Optional[str] = None,
        source_id: Optional[str] = None,
        embedding_dimension: Optional[int] = None,
        cost_estimate: Optional[float] = None,
        error_message: Optional[str] = None,
        request_metadata: Optional[Dict[str, Any]] = None
    ) -> EmbeddingUsage:
        """Create a new usage tracking record"""
        usage_data = {
            "provider_id": provider_id,
            "workspace_id": workspace_id,
            "created_by": created_by,
            "model_used": model_used,
            "tokens_processed": tokens_processed,
            "latency_ms": latency_ms,
            "success": success,
            "request_type": request_type,
            "source_type": source_type,
            "source_id": source_id,
            "embedding_dimension": embedding_dimension,
            "cost_estimate": cost_estimate,
            "error_message": error_message,
            "request_metadata": request_metadata,
            "used_at": datetime.utcnow()
        }
        
        return self.create(usage_data)
    
    def get_usage_by_id(self, usage_id: str) -> Optional[EmbeddingUsage]:
        """Get a usage record by ID"""
        return self.get_by_id(usage_id)
    
    def get_usage_by_provider(self, provider_id: str, limit: int = 100) -> List[EmbeddingUsage]:
        """Get usage records for a specific provider"""
        return self.filter_by(
            filters={"provider_id": provider_id},
            limit=limit
        )
    
    def get_usage_by_workspace(self, workspace_id: str, limit: int = 100) -> List[EmbeddingUsage]:
        """Get usage records for a specific workspace"""
        return self.filter_by(
            filters={"workspace_id": workspace_id},
            limit=limit
        )
    
    def count_usage_by_provider(self, provider_id: str) -> int:
        """Count usage records for a specific provider"""
        return self.count(filters={"provider_id": provider_id})
    
    def count_usage_by_workspace(self, workspace_id: str) -> int:
        """Count usage records for a specific workspace"""
        return self.count(filters={"workspace_id": workspace_id})
    
    def get_provider_usage_stats(
        self,
        provider_id: str,
        period_days: int = 30
    ) -> Dict[str, Any]:
        """Get usage statistics for a provider over a specific period"""
        try:
            start_date = datetime.utcnow() - timedelta(days=period_days)
            
            # Get basic stats
            stats = self.db.query(
                func.count(EmbeddingUsage.id).label('total_requests'),
                func.sum(EmbeddingUsage.tokens_processed).label('total_tokens'),
                func.avg(EmbeddingUsage.latency_ms).label('avg_latency'),
                func.sum(EmbeddingUsage.cost_estimate).label('total_cost'),
                func.count(EmbeddingUsage.id).filter(EmbeddingUsage.success == False).label('failed_requests')
            ).filter(
                and_(
                    EmbeddingUsage.provider_id == provider_id,
                    EmbeddingUsage.used_at >= start_date
                )
            ).first()
        
            total_requests = stats.total_requests or 0
            total_tokens = stats.total_tokens or 0
            avg_latency = float(stats.avg_latency) if stats.avg_latency else 0
            total_cost = float(stats.total_cost) if stats.total_cost else 0
            failed_requests = stats.failed_requests or 0
            
            # Calculate error rate
            error_rate = (failed_requests / total_requests * 100) if total_requests > 0 else 0
            
            # Get model usage breakdown
            model_stats = self.db.query(
                EmbeddingUsage.model_used,
                func.count(EmbeddingUsage.id).label('count'),
                func.sum(EmbeddingUsage.tokens_processed).label('tokens')
            ).filter(
                and_(
                    EmbeddingUsage.provider_id == provider_id,
                    EmbeddingUsage.used_at >= start_date
                )
            ).group_by(EmbeddingUsage.model_used).all()
            
            model_breakdown = [
                {
                    "model": stat.model_used,
                    "requests": stat.count,
                    "tokens": stat.tokens or 0
                }
                for stat in model_stats
            ]
            
            return {
                "period_days": period_days,
                "total_requests": total_requests,
                "total_tokens": total_tokens,
                "average_latency_ms": round(avg_latency, 2),
                "total_cost": round(total_cost, 4),
                "error_rate": round(error_rate, 2),
                "success_rate": round(100 - error_rate, 2),
                "model_breakdown": model_breakdown
            }
        except Exception as e:
            print(f"Error getting provider usage stats: {e}")
            return {
                "period_days": period_days,
                "total_requests": 0,
                "total_tokens": 0,
                "average_latency_ms": 0,
                "total_cost": 0,
                "error_rate": 0,
                "success_rate": 100,
                "model_breakdown": []
            }
    
    def get_workspace_usage_stats(
        self,
        workspace_id: str,
        period_days: int = 30
    ) -> Dict[str, Any]:
        """Get usage statistics for a workspace over a specific period"""
        try:
            start_date = datetime.utcnow() - timedelta(days=period_days)
            
            # Get basic stats
            stats = self.db.query(
                func.count(EmbeddingUsage.id).label('total_requests'),
                func.sum(EmbeddingUsage.tokens_processed).label('total_tokens'),
                func.avg(EmbeddingUsage.latency_ms).label('avg_latency'),
                func.sum(EmbeddingUsage.cost_estimate).label('total_cost'),
                func.count(EmbeddingUsage.id).filter(EmbeddingUsage.success == False).label('failed_requests')
            ).filter(
                and_(
                    EmbeddingUsage.workspace_id == workspace_id,
                    EmbeddingUsage.used_at >= start_date
                )
            ).first()
            
            total_requests = stats.total_requests or 0
            total_tokens = stats.total_tokens or 0
            avg_latency = float(stats.avg_latency) if stats.avg_latency else 0
            total_cost = float(stats.total_cost) if stats.total_cost else 0
            failed_requests = stats.failed_requests or 0
            
            # Calculate error rate
            error_rate = (failed_requests / total_requests * 100) if total_requests > 0 else 0
            
            # Get provider usage breakdown
            provider_stats = self.db.query(
                EmbeddingUsage.provider_id,
                func.count(EmbeddingUsage.id).label('count'),
                func.sum(EmbeddingUsage.tokens_processed).label('tokens')
            ).filter(
                and_(
                    EmbeddingUsage.workspace_id == workspace_id,
                    EmbeddingUsage.used_at >= start_date
                )
            ).group_by(EmbeddingUsage.provider_id).all()
            
            provider_breakdown = [
                {
                    "provider_id": stat.provider_id,
                    "requests": stat.count,
                    "tokens": stat.tokens or 0
                }
                for stat in provider_stats
            ]
            
            return {
                "period_days": period_days,
                "total_requests": total_requests,
                "total_tokens": total_tokens,
                "average_latency_ms": round(avg_latency, 2),
                "total_cost": round(total_cost, 4),
                "error_rate": round(error_rate, 2),
                "success_rate": round(100 - error_rate, 2),
                "provider_breakdown": provider_breakdown
            }
        except Exception as e:
            print(f"Error getting workspace usage stats: {e}")
            return {
                "period_days": period_days,
                "total_requests": 0,
                "total_tokens": 0,
                "average_latency_ms": 0,
                "total_cost": 0,
                "error_rate": 0,
                "success_rate": 100,
                "provider_breakdown": []
            }
    
    def get_recent_usage(
        self,
        provider_id: Optional[str] = None,
        workspace_id: Optional[str] = None,
        limit: int = 100
    ) -> List[EmbeddingUsage]:
        """Get recent usage records"""
        try:
            query = self.db.query(EmbeddingUsage)
            
            if provider_id:
                query = query.filter(EmbeddingUsage.provider_id == provider_id)
            
            if workspace_id:
                query = query.filter(EmbeddingUsage.workspace_id == workspace_id)
            
            return query.order_by(desc(EmbeddingUsage.used_at)).limit(limit).all()
        except Exception as e:
            print(f"Error getting recent usage: {e}")
            return []
    
    def get_usage_by_date_range(
        self,
        start_date: datetime,
        end_date: datetime,
        provider_id: Optional[str] = None,
        workspace_id: Optional[str] = None
    ) -> List[EmbeddingUsage]:
        """Get usage records within a date range"""
        try:
            query = self.db.query(EmbeddingUsage).filter(
                and_(
                    EmbeddingUsage.used_at >= start_date,
                    EmbeddingUsage.used_at <= end_date
                )
            )
            
            if provider_id:
                query = query.filter(EmbeddingUsage.provider_id == provider_id)
            
            if workspace_id:
                query = query.filter(EmbeddingUsage.workspace_id == workspace_id)
            
            return query.order_by(desc(EmbeddingUsage.used_at)).all()
        except Exception as e:
            print(f"Error getting usage by date range: {e}")
            return []
    
    def get_daily_usage_summary(
        self,
        provider_id: Optional[str] = None,
        workspace_id: Optional[str] = None,
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """Get daily usage summary for the last N days"""
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            
            query = self.db.query(
                func.date(EmbeddingUsage.used_at).label('date'),
                func.count(EmbeddingUsage.id).label('requests'),
                func.sum(EmbeddingUsage.tokens_processed).label('tokens'),
                func.avg(EmbeddingUsage.latency_ms).label('avg_latency'),
                func.count(EmbeddingUsage.id).filter(EmbeddingUsage.success == False).label('errors')
            ).filter(EmbeddingUsage.used_at >= start_date)
            
            if provider_id:
                query = query.filter(EmbeddingUsage.provider_id == provider_id)
            
            if workspace_id:
                query = query.filter(EmbeddingUsage.workspace_id == workspace_id)
            
            results = query.group_by(func.date(EmbeddingUsage.used_at)).order_by('date').all()
            
            return [
                {
                    "date": result.date.isoformat(),
                    "requests": result.requests,
                    "tokens": result.tokens or 0,
                    "avg_latency_ms": round(float(result.avg_latency), 2) if result.avg_latency else 0,
                    "errors": result.errors,
                    "error_rate": round((result.errors / result.requests * 100), 2) if result.requests > 0 else 0
                }
                for result in results
            ]
        except Exception as e:
            print(f"Error getting daily usage summary: {e}")
            return []
