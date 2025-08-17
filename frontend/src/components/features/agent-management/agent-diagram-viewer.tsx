'use client';

import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download, Eye, EyeOff } from 'lucide-react';
import { AgentDiagram, LangGraphData } from '@/types/agent-types';

interface AgentDiagramViewerProps {
  diagram: AgentDiagram;
  isOpen: boolean;
  onClose: () => void;
}

export default function AgentDiagramViewer({ diagram, isOpen, onClose }: AgentDiagramViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [showDetails, setShowDetails] = useState(false);

  if (!isOpen) return null;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleReset = () => setZoom(1);

  const renderLangGraphDiagram = (data: LangGraphData) => {
    return (
      <div className="relative w-full h-full bg-gray-50 rounded-lg overflow-hidden">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 800 600"
          style={{ transform: `scale(${zoom})` }}
          className="transition-transform duration-200"
        >
          {/* Render nodes */}
          {data.nodes.map((node) => (
            <g key={node.id}>
              {/* Node shape based on type */}
              {node.type === 'start' && (
                <ellipse
                  cx={node.position.x}
                  cy={node.position.y}
                  rx="40"
                  ry="25"
                  fill="#10B981"
                  stroke="#059669"
                  strokeWidth="2"
                />
              )}
              {node.type === 'end' && (
                <ellipse
                  cx={node.position.x}
                  cy={node.position.y}
                  rx="40"
                  ry="25"
                  fill="#EF4444"
                  stroke="#DC2626"
                  strokeWidth="2"
                />
              )}
              {node.type === 'process' && (
                <rect
                  x={node.position.x - 50}
                  y={node.position.y - 25}
                  width="100"
                  height="50"
                  fill="#3B82F6"
                  stroke="#1D4ED8"
                  strokeWidth="2"
                  rx="8"
                />
              )}
              {node.type === 'decision' && (
                <polygon
                  points={`${node.position.x},${node.position.y - 30} ${node.position.x + 40},${node.position.y} ${node.position.x},${node.position.y + 30} ${node.position.x - 40},${node.position.y}`}
                  fill="#F59E0B"
                  stroke="#D97706"
                  strokeWidth="2"
                />
              )}
              {node.type === 'input' && (
                <rect
                  x={node.position.x - 50}
                  y={node.position.y - 25}
                  width="100"
                  height="50"
                  fill="#8B5CF6"
                  stroke="#7C3AED"
                  strokeWidth="2"
                  rx="8"
                />
              )}
              {node.type === 'output' && (
                <rect
                  x={node.position.x - 50}
                  y={node.position.y - 25}
                  width="100"
                  height="50"
                  fill="#EC4899"
                  stroke="#DB2777"
                  strokeWidth="2"
                  rx="8"
                />
              )}
              
              {/* Node label */}
              <text
                x={node.position.x}
                y={node.position.y + 5}
                textAnchor="middle"
                fill="white"
                fontSize="12"
                fontWeight="600"
                className="select-none"
              >
                {node.name}
              </text>
            </g>
          ))}

          {/* Render edges */}
          {data.edges.map((edge) => {
            const sourceNode = data.nodes.find(n => n.id === edge.source);
            const targetNode = data.nodes.find(n => n.id === edge.target);
            
            if (!sourceNode || !targetNode) return null;

            return (
              <g key={edge.id}>
                <line
                  x1={sourceNode.position.x}
                  y1={sourceNode.position.y}
                  x2={targetNode.position.x}
                  y2={targetNode.position.y}
                  stroke="#6B7280"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
                {edge.label && (
                  <text
                    x={(sourceNode.position.x + targetNode.position.x) / 2}
                    y={(sourceNode.position.y + targetNode.position.y) / 2 - 10}
                    textAnchor="middle"
                    fill="#374151"
                    fontSize="10"
                    className="select-none"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
            </marker>
          </defs>
        </svg>
      </div>
    );
  };

  const renderDiagram = () => {
    switch (diagram.type) {
      case 'langgraph':
        return renderLangGraphDiagram(diagram.data as LangGraphData);
      case 'flowchart':
        return (
          <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="h-16 w-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-gray-600">Flowchart diagram</p>
            </div>
          </div>
        );
      case 'mindmap':
        return (
          <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="h-16 w-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <p className="text-gray-600">Mind map diagram</p>
            </div>
          </div>
        );
      case 'sequence':
        return (
          <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="h-16 w-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <p className="text-gray-600">Sequence diagram</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
            <p className="text-gray-500">Unsupported diagram type</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{diagram.title}</h2>
            {diagram.description && (
              <p className="text-sm text-gray-500 mt-1">{diagram.description}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Zoom controls */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={handleZoomOut}
                className="p-1 text-gray-600 hover:text-gray-800 rounded"
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-xs text-gray-600 px-2">{Math.round(zoom * 100)}%</span>
              <button
                onClick={handleZoomIn}
                className="p-1 text-gray-600 hover:text-gray-800 rounded"
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={handleReset}
                className="p-1 text-gray-600 hover:text-gray-800 rounded"
                title="Reset zoom"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

            {/* Toggle details */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
              title={showDetails ? "Hide details" : "Show details"}
            >
              {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>

            {/* Download */}
            <button
              onClick={() => {
                // TODO: Implement download functionality
                console.log('Download diagram');
              }}
              className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
              title="Download diagram"
            >
              <Download className="h-4 w-4" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Diagram */}
          <div className="flex-1 p-6 overflow-auto">
            {renderDiagram()}
          </div>

          {/* Details panel */}
          {showDetails && (
            <div className="w-80 border-l border-gray-200 p-6 overflow-y-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Diagram Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {diagram.type}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                  <p className="text-sm text-gray-600">
                    {new Date(diagram.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                  <p className="text-sm text-gray-600">
                    {new Date(diagram.updatedAt).toLocaleDateString()}
                  </p>
                </div>

                {diagram.type === 'langgraph' && diagram.data && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nodes</label>
                    <p className="text-sm text-gray-600">
                      {(diagram.data as LangGraphData).nodes.length} nodes
                    </p>
                    
                    <label className="block text-sm font-medium text-gray-700 mb-1 mt-3">Edges</label>
                    <p className="text-sm text-gray-600">
                      {(diagram.data as LangGraphData).edges.length} connections
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
