# Python Advanced Interview Preparation Guide

A comprehensive guide covering advanced Python concepts for technical interviews.

---

## Table of Contents

1. [Advanced Python Syntax](#1-advanced-python-syntax)
2. [Object-Oriented Programming (OOP)](#2-object-oriented-programming-oop)
3. [Decorators & Metaclasses](#3-decorators--metaclasses)
4. [Generators & Iterators](#4-generators--iterators)
5. [Context Managers](#5-context-managers)
6. [Concurrency & Parallelism](#6-concurrency--parallelism)
7. [Memory Management & GC](#7-memory-management--gc)
8. [ORM (Object-Relational Mapping)](#8-orm-object-relational-mapping)
9. [Design Patterns](#9-design-patterns)
10. [Testing & Best Practices](#10-testing--best-practices)
11. [Performance Optimization](#11-performance-optimization)
12. [Common Interview Questions](#12-common-interview-questions)

---

## 1. Advanced Python Syntax

### 1.1 List Comprehensions vs Generator Expressions

```python
# List comprehension - creates list in memory
squares_list = [x**2 for x in range(1000000)]  # Memory intensive

# Generator expression - lazy evaluation
squares_gen = (x**2 for x in range(1000000))  # Memory efficient

# Nested comprehension
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
flattened = [num for row in matrix for num in row]  # [1, 2, 3, 4, 5, 6, 7, 8, 9]

# Dictionary comprehension
word_lengths = {word: len(word) for word in ['hello', 'world']}

# Set comprehension
unique_lengths = {len(word) for word in ['hello', 'world', 'python']}

# Conditional comprehension
evens = [x for x in range(20) if x % 2 == 0]
labeled = ['even' if x % 2 == 0 else 'odd' for x in range(10)]
```

### 1.2 Unpacking & Packing

```python
# Extended unpacking
first, *middle, last = [1, 2, 3, 4, 5]
# first=1, middle=[2, 3, 4], last=5

# Swapping variables
a, b = b, a

# Function argument unpacking
def func(a, b, c):
    return a + b + c

args = [1, 2, 3]
kwargs = {'a': 1, 'b': 2, 'c': 3}

func(*args)      # Unpacks list as positional args
func(**kwargs)   # Unpacks dict as keyword args

# Merging dictionaries (Python 3.9+)
dict1 = {'a': 1, 'b': 2}
dict2 = {'c': 3, 'd': 4}
merged = dict1 | dict2  # {'a': 1, 'b': 2, 'c': 3, 'd': 4}
merged = {**dict1, **dict2}  # Also works in earlier versions
```

### 1.3 Walrus Operator (:=) - Python 3.8+

```python
# Assignment expression
if (n := len(data)) > 10:
    print(f"List has {n} elements")

# In comprehensions
filtered = [y for x in data if (y := expensive_func(x)) is not None]

# In while loops
while (line := file.readline()):
    process(line)
```

### 1.4 Type Hints & Annotations

```python
from typing import (
    List, Dict, Tuple, Optional, Union, Callable, 
    TypeVar, Generic, Protocol, Literal, Final
)

# Basic type hints
def greet(name: str) -> str:
    return f"Hello, {name}"

# Complex types
def process(
    items: List[int],
    mapping: Dict[str, int],
    callback: Callable[[int], str]
) -> Optional[str]:
    pass

# Union types (Python 3.10+ uses |)
def handle(value: Union[int, str]) -> None: pass
def handle(value: int | str) -> None: pass  # Python 3.10+

# TypeVar for generics
T = TypeVar('T')

def first(items: List[T]) -> T:
    return items[0]

# Generic classes
class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: List[T] = []
    
    def push(self, item: T) -> None:
        self._items.append(item)
    
    def pop(self) -> T:
        return self._items.pop()

# Protocol (structural subtyping)
class Drawable(Protocol):
    def draw(self) -> None: ...

def render(obj: Drawable) -> None:
    obj.draw()

# Literal types
Mode = Literal["read", "write", "append"]

def open_file(path: str, mode: Mode) -> None:
    pass

# Final (constant)
MAX_SIZE: Final = 100
```

### 1.5 Match Statement (Python 3.10+)

```python
def handle_response(response: dict):
    match response:
        case {"status": 200, "data": data}:
            return process_data(data)
        case {"status": 404}:
            return "Not found"
        case {"status": status} if status >= 500:
            return f"Server error: {status}"
        case _:
            return "Unknown response"

# Pattern matching with classes
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

def describe_point(point):
    match point:
        case Point(x=0, y=0):
            return "Origin"
        case Point(x=0, y=y):
            return f"On Y-axis at {y}"
        case Point(x=x, y=0):
            return f"On X-axis at {x}"
        case Point(x=x, y=y):
            return f"Point at ({x}, {y})"
```

---

## 2. Object-Oriented Programming (OOP)

### 2.1 Classes & Special Methods

```python
class Person:
    # Class variable
    species = "Homo sapiens"
    
    def __init__(self, name: str, age: int):
        # Instance variables
        self.name = name
        self._age = age  # Protected (convention)
        self.__id = id(self)  # Private (name mangling)
    
    # Property decorator
    @property
    def age(self) -> int:
        return self._age
    
    @age.setter
    def age(self, value: int):
        if value < 0:
            raise ValueError("Age cannot be negative")
        self._age = value
    
    # String representations
    def __str__(self) -> str:
        return f"{self.name}, {self.age} years old"
    
    def __repr__(self) -> str:
        return f"Person(name={self.name!r}, age={self.age!r})"
    
    # Comparison methods
    def __eq__(self, other) -> bool:
        if not isinstance(other, Person):
            return NotImplemented
        return self.name == other.name and self.age == other.age
    
    def __lt__(self, other) -> bool:
        if not isinstance(other, Person):
            return NotImplemented
        return self.age < other.age
    
    # Hash (required if __eq__ is defined)
    def __hash__(self) -> int:
        return hash((self.name, self.age))
    
    # Context manager protocol
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        pass
    
    # Iterator protocol
    def __iter__(self):
        return iter([self.name, self.age])
    
    # Callable
    def __call__(self, greeting: str) -> str:
        return f"{greeting}, {self.name}!"
    
    # Container methods
    def __len__(self) -> int:
        return len(self.name)
    
    def __getitem__(self, key):
        return getattr(self, key)
    
    # Class methods
    @classmethod
    def from_birth_year(cls, name: str, birth_year: int) -> "Person":
        from datetime import datetime
        age = datetime.now().year - birth_year
        return cls(name, age)
    
    # Static methods
    @staticmethod
    def is_adult(age: int) -> bool:
        return age >= 18
```

### 2.2 Inheritance & MRO (Method Resolution Order)

```python
class Animal:
    def __init__(self, name: str):
        self.name = name
    
    def speak(self) -> str:
        raise NotImplementedError

class Mammal(Animal):
    def __init__(self, name: str, warm_blooded: bool = True):
        super().__init__(name)
        self.warm_blooded = warm_blooded

class Flyable:
    def fly(self) -> str:
        return f"{self.name} is flying"

# Multiple inheritance
class Bat(Mammal, Flyable):
    def speak(self) -> str:
        return "Squeak!"

# Check MRO
print(Bat.__mro__)
# (<class 'Bat'>, <class 'Mammal'>, <class 'Animal'>, 
#  <class 'Flyable'>, <class 'object'>)

# Diamond problem resolution
class A:
    def method(self):
        print("A")

class B(A):
    def method(self):
        print("B")
        super().method()

class C(A):
    def method(self):
        print("C")
        super().method()

class D(B, C):
    def method(self):
        print("D")
        super().method()

d = D()
d.method()  # Prints: D, B, C, A (follows MRO)
```

### 2.3 Abstract Base Classes (ABC)

```python
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float:
        """Calculate the area of the shape."""
        pass
    
    @abstractmethod
    def perimeter(self) -> float:
        """Calculate the perimeter of the shape."""
        pass
    
    # Concrete method in abstract class
    def describe(self) -> str:
        return f"Shape with area {self.area()}"

class Rectangle(Shape):
    def __init__(self, width: float, height: float):
        self.width = width
        self.height = height
    
    def area(self) -> float:
        return self.width * self.height
    
    def perimeter(self) -> float:
        return 2 * (self.width + self.height)

# Cannot instantiate abstract class
# shape = Shape()  # TypeError!

rect = Rectangle(5, 3)
print(rect.area())  # 15
```

### 2.4 Data Classes (Python 3.7+)

```python
from dataclasses import dataclass, field, asdict, astuple
from typing import List

@dataclass
class Product:
    name: str
    price: float
    quantity: int = 0
    tags: List[str] = field(default_factory=list)
    
    # Computed field
    @property
    def total_value(self) -> float:
        return self.price * self.quantity
    
    # Post-init processing
    def __post_init__(self):
        if self.price < 0:
            raise ValueError("Price cannot be negative")

# Frozen (immutable) dataclass
@dataclass(frozen=True)
class Point:
    x: float
    y: float

# With ordering
@dataclass(order=True)
class Person:
    sort_index: int = field(init=False, repr=False)
    name: str
    age: int
    
    def __post_init__(self):
        self.sort_index = self.age

# Usage
p1 = Product("Widget", 9.99, 5, ["electronics"])
print(asdict(p1))  # Convert to dictionary
print(astuple(p1))  # Convert to tuple
```

### 2.5 Slots

```python
class OptimizedPerson:
    __slots__ = ['name', 'age']  # Saves memory, faster attribute access
    
    def __init__(self, name: str, age: int):
        self.name = name
        self.age = age

# Cannot add new attributes dynamically
person = OptimizedPerson("Alice", 30)
# person.email = "alice@example.com"  # AttributeError!

# Memory comparison
import sys

class Regular:
    def __init__(self):
        self.a = 1
        self.b = 2

class Slotted:
    __slots__ = ['a', 'b']
    def __init__(self):
        self.a = 1
        self.b = 2

regular = Regular()
slotted = Slotted()

print(sys.getsizeof(regular.__dict__))  # ~104 bytes
# Slotted doesn't have __dict__
```

---

## 3. Decorators & Metaclasses

### 3.1 Function Decorators

```python
from functools import wraps
import time

# Basic decorator
def timer(func):
    @wraps(func)  # Preserves function metadata
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        end = time.perf_counter()
        print(f"{func.__name__} took {end - start:.4f} seconds")
        return result
    return wrapper

# Decorator with arguments
def retry(max_attempts: int = 3, delay: float = 1.0):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            attempts = 0
            while attempts < max_attempts:
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    attempts += 1
                    if attempts == max_attempts:
                        raise
                    time.sleep(delay)
        return wrapper
    return decorator

# Usage
@timer
@retry(max_attempts=3, delay=0.5)
def fetch_data(url: str):
    pass

# Decorator with optional arguments
def decorator(func=None, *, option1=True, option2=False):
    def actual_decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if option1:
                print("Option 1 enabled")
            return f(*args, **kwargs)
        return wrapper
    
    if func is not None:
        return actual_decorator(func)
    return actual_decorator

# Can be used both ways:
@decorator
def func1(): pass

@decorator(option1=False)
def func2(): pass
```

### 3.2 Class Decorators

```python
def singleton(cls):
    """Class decorator for singleton pattern."""
    instances = {}
    
    @wraps(cls)
    def get_instance(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]
    
    return get_instance

@singleton
class Database:
    def __init__(self):
        print("Initializing database connection")

db1 = Database()  # Prints message
db2 = Database()  # No message - same instance
print(db1 is db2)  # True

# Class decorator that adds methods
def add_repr(cls):
    def __repr__(self):
        attrs = ', '.join(f"{k}={v!r}" for k, v in self.__dict__.items())
        return f"{cls.__name__}({attrs})"
    cls.__repr__ = __repr__
    return cls

@add_repr
class Person:
    def __init__(self, name, age):
        self.name = name
        self.age = age

print(Person("Alice", 30))  # Person(name='Alice', age=30)
```

### 3.3 Metaclasses

```python
# Metaclass basics
class Meta(type):
    def __new__(mcs, name, bases, namespace):
        # Called when class is created
        print(f"Creating class: {name}")
        return super().__new__(mcs, name, bases, namespace)
    
    def __init__(cls, name, bases, namespace):
        # Called after class is created
        print(f"Initializing class: {name}")
        super().__init__(name, bases, namespace)
    
    def __call__(cls, *args, **kwargs):
        # Called when instance is created
        print(f"Creating instance of: {cls.__name__}")
        return super().__call__(*args, **kwargs)

class MyClass(metaclass=Meta):
    pass

# Practical example: Auto-registration
class PluginMeta(type):
    plugins = {}
    
    def __new__(mcs, name, bases, namespace):
        cls = super().__new__(mcs, name, bases, namespace)
        if name != 'Plugin':  # Don't register base class
            mcs.plugins[name] = cls
        return cls

class Plugin(metaclass=PluginMeta):
    pass

class AuthPlugin(Plugin):
    pass

class LoggingPlugin(Plugin):
    pass

print(PluginMeta.plugins)  # {'AuthPlugin': <class>, 'LoggingPlugin': <class>}

# Singleton metaclass
class SingletonMeta(type):
    _instances = {}
    
    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]

class Singleton(metaclass=SingletonMeta):
    pass
```

### 3.4 Descriptors

```python
# Descriptor protocol
class Validator:
    def __set_name__(self, owner, name):
        self.name = name
        self.storage_name = f'_{name}'
    
    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return getattr(obj, self.storage_name, None)
    
    def __set__(self, obj, value):
        self.validate(value)
        setattr(obj, self.storage_name, value)
    
    def validate(self, value):
        pass

class PositiveNumber(Validator):
    def validate(self, value):
        if value <= 0:
            raise ValueError(f"{self.name} must be positive")

class NonEmptyString(Validator):
    def validate(self, value):
        if not isinstance(value, str) or not value.strip():
            raise ValueError(f"{self.name} must be a non-empty string")

class Product:
    name = NonEmptyString()
    price = PositiveNumber()
    quantity = PositiveNumber()
    
    def __init__(self, name: str, price: float, quantity: int):
        self.name = name
        self.price = price
        self.quantity = quantity

product = Product("Widget", 9.99, 5)
# product.price = -10  # ValueError!
```

---

## 4. Generators & Iterators

### 4.1 Iterator Protocol

```python
class CountDown:
    """Custom iterator that counts down from n to 0."""
    
    def __init__(self, n: int):
        self.n = n
    
    def __iter__(self):
        return self
    
    def __next__(self):
        if self.n < 0:
            raise StopIteration
        result = self.n
        self.n -= 1
        return result

for num in CountDown(5):
    print(num)  # 5, 4, 3, 2, 1, 0

# Separate iterator class
class Book:
    def __init__(self, pages: list):
        self.pages = pages
    
    def __iter__(self):
        return BookIterator(self)

class BookIterator:
    def __init__(self, book: Book):
        self.book = book
        self.index = 0
    
    def __iter__(self):
        return self
    
    def __next__(self):
        if self.index >= len(self.book.pages):
            raise StopIteration
        page = self.book.pages[self.index]
        self.index += 1
        return page
```

### 4.2 Generators

```python
# Generator function
def countdown(n: int):
    while n >= 0:
        yield n
        n -= 1

# Generator with send
def accumulator():
    total = 0
    while True:
        value = yield total
        if value is None:
            break
        total += value

acc = accumulator()
next(acc)  # Initialize generator
print(acc.send(10))  # 10
print(acc.send(20))  # 30
print(acc.send(5))   # 35

# Generator delegation (yield from)
def chain(*iterables):
    for iterable in iterables:
        yield from iterable

list(chain([1, 2], [3, 4], [5, 6]))  # [1, 2, 3, 4, 5, 6]

# Recursive generator
def flatten(items):
    for item in items:
        if isinstance(item, list):
            yield from flatten(item)
        else:
            yield item

nested = [1, [2, [3, 4], 5], 6]
list(flatten(nested))  # [1, 2, 3, 4, 5, 6]

# Generator for infinite sequence
def fibonacci():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

from itertools import islice
list(islice(fibonacci(), 10))  # [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

### 4.3 Async Generators (Python 3.6+)

```python
import asyncio

async def async_range(start: int, stop: int):
    for i in range(start, stop):
        await asyncio.sleep(0.1)  # Simulate async operation
        yield i

async def main():
    async for num in async_range(0, 5):
        print(num)

asyncio.run(main())

# Async comprehension
async def fetch_all():
    results = [x async for x in async_range(0, 5)]
    return results
```

---

## 5. Context Managers

### 5.1 Context Manager Protocol

```python
class FileManager:
    def __init__(self, filename: str, mode: str):
        self.filename = filename
        self.mode = mode
        self.file = None
    
    def __enter__(self):
        self.file = open(self.filename, self.mode)
        return self.file
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.file:
            self.file.close()
        # Return True to suppress exception, False to propagate
        return False

with FileManager('test.txt', 'w') as f:
    f.write('Hello, World!')
```

### 5.2 contextlib Utilities

```python
from contextlib import contextmanager, asynccontextmanager, suppress, redirect_stdout

# Using decorator
@contextmanager
def timer():
    import time
    start = time.perf_counter()
    try:
        yield
    finally:
        end = time.perf_counter()
        print(f"Elapsed: {end - start:.4f} seconds")

with timer():
    sum(range(1000000))

# Suppress specific exceptions
with suppress(FileNotFoundError):
    os.remove('nonexistent.txt')

# Redirect stdout
from io import StringIO

f = StringIO()
with redirect_stdout(f):
    print("This goes to the string buffer")

output = f.getvalue()

# Async context manager
@asynccontextmanager
async def async_db_connection():
    conn = await connect_to_db()
    try:
        yield conn
    finally:
        await conn.close()

# ExitStack for dynamic context management
from contextlib import ExitStack

with ExitStack() as stack:
    files = [stack.enter_context(open(f)) for f in filenames]
    # All files will be closed when exiting
```

---

## 6. Concurrency & Parallelism

### 6.1 Threading

```python
import threading
from concurrent.futures import ThreadPoolExecutor
import queue

# Basic threading
def worker(name: str):
    print(f"Worker {name} starting")
    # Do work...
    print(f"Worker {name} finished")

threads = []
for i in range(5):
    t = threading.Thread(target=worker, args=(f"Thread-{i}",))
    threads.append(t)
    t.start()

for t in threads:
    t.join()

# Thread synchronization
class Counter:
    def __init__(self):
        self.value = 0
        self.lock = threading.Lock()
    
    def increment(self):
        with self.lock:
            self.value += 1

# ThreadPoolExecutor
def fetch_url(url: str) -> str:
    # Simulate HTTP request
    return f"Data from {url}"

urls = ['http://example.com/1', 'http://example.com/2']

with ThreadPoolExecutor(max_workers=5) as executor:
    # Submit tasks
    futures = [executor.submit(fetch_url, url) for url in urls]
    
    # Get results
    for future in futures:
        print(future.result())
    
    # Or use map
    results = executor.map(fetch_url, urls)

# Producer-Consumer with Queue
def producer(q: queue.Queue):
    for i in range(10):
        q.put(i)
    q.put(None)  # Sentinel

def consumer(q: queue.Queue):
    while True:
        item = q.get()
        if item is None:
            break
        print(f"Consumed: {item}")
        q.task_done()

q = queue.Queue()
prod = threading.Thread(target=producer, args=(q,))
cons = threading.Thread(target=consumer, args=(q,))
prod.start()
cons.start()
prod.join()
cons.join()
```

### 6.2 Multiprocessing

```python
from multiprocessing import Process, Pool, Queue, Manager
import os

# Basic multiprocessing
def worker(num: int):
    print(f"Worker {num}, PID: {os.getpid()}")
    return num * num

if __name__ == '__main__':
    processes = []
    for i in range(5):
        p = Process(target=worker, args=(i,))
        processes.append(p)
        p.start()
    
    for p in processes:
        p.join()

# Process Pool
def cpu_bound_task(n: int) -> int:
    return sum(i * i for i in range(n))

if __name__ == '__main__':
    with Pool(processes=4) as pool:
        results = pool.map(cpu_bound_task, [1000000] * 10)
        print(results)

# Shared state with Manager
if __name__ == '__main__':
    with Manager() as manager:
        shared_list = manager.list()
        shared_dict = manager.dict()
        
        def add_item(lst, item):
            lst.append(item)
        
        processes = [
            Process(target=add_item, args=(shared_list, i))
            for i in range(10)
        ]
        
        for p in processes:
            p.start()
        for p in processes:
            p.join()
        
        print(list(shared_list))
```

### 6.3 Asyncio

```python
import asyncio
import aiohttp  # pip install aiohttp

# Basic async/await
async def say_hello(name: str, delay: float):
    await asyncio.sleep(delay)
    print(f"Hello, {name}!")

async def main():
    await asyncio.gather(
        say_hello("Alice", 1),
        say_hello("Bob", 2),
        say_hello("Charlie", 0.5),
    )

asyncio.run(main())

# Async HTTP requests
async def fetch(session: aiohttp.ClientSession, url: str) -> str:
    async with session.get(url) as response:
        return await response.text()

async def fetch_all(urls: list[str]) -> list[str]:
    async with aiohttp.ClientSession() as session:
        tasks = [fetch(session, url) for url in urls]
        return await asyncio.gather(*tasks)

# Async semaphore for rate limiting
async def rate_limited_fetch(
    session: aiohttp.ClientSession,
    url: str,
    semaphore: asyncio.Semaphore
) -> str:
    async with semaphore:
        async with session.get(url) as response:
            return await response.text()

async def fetch_with_limit(urls: list[str], limit: int = 10):
    semaphore = asyncio.Semaphore(limit)
    async with aiohttp.ClientSession() as session:
        tasks = [rate_limited_fetch(session, url, semaphore) for url in urls]
        return await asyncio.gather(*tasks)

# Async queue
async def producer(queue: asyncio.Queue):
    for i in range(10):
        await queue.put(i)
        await asyncio.sleep(0.1)
    await queue.put(None)

async def consumer(queue: asyncio.Queue):
    while True:
        item = await queue.get()
        if item is None:
            break
        print(f"Consumed: {item}")

async def main():
    queue = asyncio.Queue()
    await asyncio.gather(
        producer(queue),
        consumer(queue),
    )

# Timeouts
async def long_operation():
    await asyncio.sleep(10)
    return "Done"

async def main():
    try:
        result = await asyncio.wait_for(long_operation(), timeout=5.0)
    except asyncio.TimeoutError:
        print("Operation timed out")
```

### 6.4 GIL (Global Interpreter Lock)

```python
"""
The GIL is a mutex that protects access to Python objects,
preventing multiple threads from executing Python bytecode simultaneously.

Key points:
- Only affects CPython (not Jython, IronPython, or PyPy)
- Limits multi-threaded CPU-bound tasks
- I/O-bound tasks can still benefit from threading
- Use multiprocessing for CPU-bound parallelism

GIL is released:
- During I/O operations
- When using C extensions (numpy, etc.)
- When calling time.sleep()
"""

# CPU-bound: Use multiprocessing
from multiprocessing import Pool

def cpu_intensive(n):
    return sum(i * i for i in range(n))

with Pool(4) as pool:
    results = pool.map(cpu_intensive, [10**7] * 4)

# I/O-bound: Use threading or asyncio
import threading

def io_intensive(url):
    import urllib.request
    return urllib.request.urlopen(url).read()

threads = [
    threading.Thread(target=io_intensive, args=(url,))
    for url in urls
]
```

---

## 7. Memory Management & GC

### 7.1 Reference Counting

```python
import sys

# Get reference count
a = [1, 2, 3]
print(sys.getrefcount(a))  # 2 (a + function argument)

b = a
print(sys.getrefcount(a))  # 3

del b
print(sys.getrefcount(a))  # 2

# Weak references (don't increase refcount)
import weakref

class MyClass:
    pass

obj = MyClass()
weak_ref = weakref.ref(obj)

print(weak_ref())  # <MyClass object>
del obj
print(weak_ref())  # None
```

### 7.2 Garbage Collection

```python
import gc

# Manual garbage collection
gc.collect()

# Get GC thresholds
print(gc.get_threshold())  # (700, 10, 10)

# Set thresholds
gc.set_threshold(1000, 15, 15)

# Disable GC (for performance-critical sections)
gc.disable()
# ... critical code ...
gc.enable()

# Debug circular references
class Node:
    def __init__(self, name):
        self.name = name
        self.next = None

a = Node('A')
b = Node('B')
a.next = b
b.next = a  # Circular reference

# Check for unreachable objects
gc.set_debug(gc.DEBUG_LEAK)
gc.collect()
```

### 7.3 Memory Profiling

```python
# Memory usage
import tracemalloc

tracemalloc.start()

# Your code here
data = [i ** 2 for i in range(1000000)]

current, peak = tracemalloc.get_traced_memory()
print(f"Current: {current / 1024 / 1024:.2f} MB")
print(f"Peak: {peak / 1024 / 1024:.2f} MB")

tracemalloc.stop()

# Object size
import sys

obj = {'a': 1, 'b': 2}
print(sys.getsizeof(obj))  # Size in bytes

# Deep size (including referenced objects)
def get_deep_size(obj, seen=None):
    if seen is None:
        seen = set()
    
    obj_id = id(obj)
    if obj_id in seen:
        return 0
    
    seen.add(obj_id)
    size = sys.getsizeof(obj)
    
    if isinstance(obj, dict):
        size += sum(get_deep_size(k, seen) + get_deep_size(v, seen) 
                   for k, v in obj.items())
    elif isinstance(obj, (list, tuple, set, frozenset)):
        size += sum(get_deep_size(i, seen) for i in obj)
    
    return size
```

---

## 8. ORM (Object-Relational Mapping)

### 8.1 SQLAlchemy Core Concepts

```python
from sqlalchemy import (
    create_engine, Column, Integer, String, ForeignKey,
    DateTime, Text, Boolean, Float, Enum as SQLEnum
)
from sqlalchemy.orm import (
    declarative_base, relationship, sessionmaker, 
    Session, joinedload, selectinload
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime
import uuid
import enum

# Engine & Base
engine = create_engine(
    "postgresql://user:pass@localhost/db",
    echo=True,  # Log SQL
    pool_size=5,
    max_overflow=10,
)

Base = declarative_base()

# Enum
class Status(enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"

# Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    status = Column(SQLEnum(Status), default=Status.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    posts = relationship("Post", back_populates="author", cascade="all, delete-orphan")
    profile = relationship("Profile", back_populates="user", uselist=False)
    
    def __repr__(self):
        return f"<User(username={self.username})>"

class Profile(Base):
    __tablename__ = "profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True)
    bio = Column(Text)
    avatar_url = Column(String(500))
    settings = Column(JSONB, default={})
    
    user = relationship("User", back_populates="profile")

class Post(Base):
    __tablename__ = "posts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    content = Column(Text)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    published = Column(Boolean, default=False)
    views = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    author = relationship("User", back_populates="posts")
    tags = relationship("Tag", secondary="post_tags", back_populates="posts")

class Tag(Base):
    __tablename__ = "tags"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, nullable=False)
    
    posts = relationship("Post", secondary="post_tags", back_populates="tags")

# Association table (many-to-many)
from sqlalchemy import Table

post_tags = Table(
    "post_tags",
    Base.metadata,
    Column("post_id", UUID(as_uuid=True), ForeignKey("posts.id"), primary_key=True),
    Column("tag_id", UUID(as_uuid=True), ForeignKey("tags.id"), primary_key=True),
)

# Create tables
Base.metadata.create_all(engine)

# Session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
```

### 8.2 CRUD Operations

```python
from sqlalchemy.orm import Session

# Create
def create_user(db: Session, email: str, username: str, password_hash: str) -> User:
    user = User(email=email, username=username, password_hash=password_hash)
    db.add(user)
    db.commit()
    db.refresh(user)  # Reload from DB to get generated values
    return user

# Read
def get_user_by_id(db: Session, user_id: str) -> User | None:
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> list[User]:
    return db.query(User).offset(skip).limit(limit).all()

# Update
def update_user(db: Session, user_id: str, **kwargs) -> User | None:
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        for key, value in kwargs.items():
            setattr(user, key, value)
        db.commit()
        db.refresh(user)
    return user

# Delete
def delete_user(db: Session, user_id: str) -> bool:
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        db.delete(user)
        db.commit()
        return True
    return False
```

### 8.3 Advanced Queries

```python
from sqlalchemy import and_, or_, func, desc, asc
from sqlalchemy.orm import joinedload, selectinload, contains_eager

# Filtering
users = db.query(User).filter(
    and_(
        User.status == Status.ACTIVE,
        User.created_at >= datetime(2024, 1, 1)
    )
).all()

# Complex conditions
users = db.query(User).filter(
    or_(
        User.email.like("%@gmail.com"),
        User.username.startswith("admin")
    )
).all()

# Ordering
users = db.query(User).order_by(desc(User.created_at)).all()

# Aggregation
from sqlalchemy import func

# Count
user_count = db.query(func.count(User.id)).scalar()

# Group by
status_counts = db.query(
    User.status,
    func.count(User.id).label("count")
).group_by(User.status).all()

# Eager loading (avoid N+1)
# joinedload - single query with JOIN
users = db.query(User).options(
    joinedload(User.posts)
).all()

# selectinload - separate SELECT IN query (better for large collections)
users = db.query(User).options(
    selectinload(User.posts).selectinload(Post.tags)
).all()

# Subqueries
from sqlalchemy import select

subquery = select(Post.author_id).where(Post.published == True).subquery()
users_with_published = db.query(User).filter(User.id.in_(subquery)).all()

# Joins
users_with_posts = db.query(User).join(User.posts).filter(
    Post.published == True
).distinct().all()

# Raw SQL
from sqlalchemy import text

result = db.execute(
    text("SELECT * FROM users WHERE email = :email"),
    {"email": "user@example.com"}
)
```

### 8.4 Transactions & Session Management

```python
from sqlalchemy.orm import Session
from contextlib import contextmanager

# Context manager for session
@contextmanager
def get_db_session():
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

# Usage
with get_db_session() as db:
    user = create_user(db, "email@example.com", "username", "hash")

# Nested transactions (savepoints)
def complex_operation(db: Session):
    try:
        # Start savepoint
        with db.begin_nested():
            # Operation 1
            user = User(email="user1@example.com", username="user1", password_hash="hash")
            db.add(user)
            db.flush()  # Get ID without committing
            
            # Operation 2 that might fail
            # If this fails, only this savepoint is rolled back
            raise Exception("Something went wrong")
        
    except Exception:
        # Handle partial rollback
        pass
    
    # Continue with other operations
    # Main transaction is still active

# Bulk operations (more efficient)
def bulk_insert_users(db: Session, users_data: list[dict]):
    db.bulk_insert_mappings(User, users_data)
    db.commit()

def bulk_update_users(db: Session, users_data: list[dict]):
    db.bulk_update_mappings(User, users_data)
    db.commit()
```

### 8.5 Alembic Migrations

```bash
# Initialize Alembic
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Add users table"

# Run migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

```python
# alembic/env.py
from app.models import Base
target_metadata = Base.metadata

# Migration file example
def upgrade():
    op.create_table(
        'users',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('username', sa.String(100), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('username'),
    )
    op.create_index('ix_users_email', 'users', ['email'])

def downgrade():
    op.drop_index('ix_users_email', 'users')
    op.drop_table('users')
```

### 8.6 Async SQLAlchemy

```python
from sqlalchemy.ext.asyncio import (
    create_async_engine, AsyncSession, async_sessionmaker
)
from sqlalchemy.future import select

# Async engine
async_engine = create_async_engine(
    "postgresql+asyncpg://user:pass@localhost/db",
    echo=True,
)

# Async session
async_session = async_sessionmaker(
    async_engine, class_=AsyncSession, expire_on_commit=False
)

# Async CRUD
async def get_user_async(session: AsyncSession, user_id: str) -> User | None:
    result = await session.execute(
        select(User).filter(User.id == user_id)
    )
    return result.scalar_one_or_none()

async def create_user_async(session: AsyncSession, **kwargs) -> User:
    user = User(**kwargs)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user

# Context manager
async def get_async_db():
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

---

## 9. Design Patterns

### 9.1 Creational Patterns

```python
# Singleton
class Singleton:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

# Factory
class AnimalFactory:
    @staticmethod
    def create(animal_type: str) -> "Animal":
        if animal_type == "dog":
            return Dog()
        elif animal_type == "cat":
            return Cat()
        raise ValueError(f"Unknown animal: {animal_type}")

# Builder
class QueryBuilder:
    def __init__(self):
        self._select = []
        self._from = None
        self._where = []
        self._order_by = []
    
    def select(self, *columns):
        self._select.extend(columns)
        return self
    
    def from_table(self, table: str):
        self._from = table
        return self
    
    def where(self, condition: str):
        self._where.append(condition)
        return self
    
    def order_by(self, column: str, direction: str = "ASC"):
        self._order_by.append(f"{column} {direction}")
        return self
    
    def build(self) -> str:
        query = f"SELECT {', '.join(self._select)} FROM {self._from}"
        if self._where:
            query += f" WHERE {' AND '.join(self._where)}"
        if self._order_by:
            query += f" ORDER BY {', '.join(self._order_by)}"
        return query

query = (QueryBuilder()
    .select("id", "name", "email")
    .from_table("users")
    .where("status = 'active'")
    .order_by("created_at", "DESC")
    .build())
```

### 9.2 Structural Patterns

```python
# Adapter
class OldPaymentSystem:
    def make_payment(self, amount: float, currency: str):
        return f"Paid {amount} {currency}"

class NewPaymentInterface:
    def pay(self, amount: float) -> str:
        raise NotImplementedError

class PaymentAdapter(NewPaymentInterface):
    def __init__(self, old_system: OldPaymentSystem):
        self.old_system = old_system
    
    def pay(self, amount: float) -> str:
        return self.old_system.make_payment(amount, "USD")

# Decorator Pattern
class Coffee:
    def cost(self) -> float:
        return 2.0
    
    def description(self) -> str:
        return "Coffee"

class CoffeeDecorator(Coffee):
    def __init__(self, coffee: Coffee):
        self._coffee = coffee
    
    def cost(self) -> float:
        return self._coffee.cost()
    
    def description(self) -> str:
        return self._coffee.description()

class MilkDecorator(CoffeeDecorator):
    def cost(self) -> float:
        return super().cost() + 0.5
    
    def description(self) -> str:
        return super().description() + ", Milk"

coffee = MilkDecorator(Coffee())
print(coffee.description())  # Coffee, Milk
print(coffee.cost())  # 2.5

# Facade
class VideoConverter:
    def convert(self, filename: str, format: str) -> str:
        # Complex subsystem operations
        codec = CodecFactory.extract(filename)
        compression = BitrateReader.read(filename, codec)
        result = AudioMixer.fix(compression)
        return VideoFile(result, format)
```

### 9.3 Behavioral Patterns

```python
# Observer
from typing import List, Callable

class EventEmitter:
    def __init__(self):
        self._subscribers: dict[str, List[Callable]] = {}
    
    def subscribe(self, event: str, callback: Callable):
        if event not in self._subscribers:
            self._subscribers[event] = []
        self._subscribers[event].append(callback)
    
    def unsubscribe(self, event: str, callback: Callable):
        if event in self._subscribers:
            self._subscribers[event].remove(callback)
    
    def emit(self, event: str, *args, **kwargs):
        if event in self._subscribers:
            for callback in self._subscribers[event]:
                callback(*args, **kwargs)

# Strategy
class PaymentStrategy:
    def pay(self, amount: float) -> str:
        raise NotImplementedError

class CreditCardPayment(PaymentStrategy):
    def pay(self, amount: float) -> str:
        return f"Paid ${amount} with credit card"

class PayPalPayment(PaymentStrategy):
    def pay(self, amount: float) -> str:
        return f"Paid ${amount} with PayPal"

class PaymentContext:
    def __init__(self, strategy: PaymentStrategy):
        self._strategy = strategy
    
    def set_strategy(self, strategy: PaymentStrategy):
        self._strategy = strategy
    
    def execute_payment(self, amount: float) -> str:
        return self._strategy.pay(amount)

# Command
class Command:
    def execute(self): pass
    def undo(self): pass

class TextEditor:
    def __init__(self):
        self.content = ""
        self.history: List[Command] = []
    
    def execute(self, command: Command):
        command.execute()
        self.history.append(command)
    
    def undo(self):
        if self.history:
            command = self.history.pop()
            command.undo()

class InsertCommand(Command):
    def __init__(self, editor: TextEditor, text: str, position: int):
        self.editor = editor
        self.text = text
        self.position = position
    
    def execute(self):
        self.editor.content = (
            self.editor.content[:self.position] + 
            self.text + 
            self.editor.content[self.position:]
        )
    
    def undo(self):
        self.editor.content = (
            self.editor.content[:self.position] + 
            self.editor.content[self.position + len(self.text):]
        )
```

---

## 10. Testing & Best Practices

### 10.1 Unit Testing with pytest

```python
import pytest
from unittest.mock import Mock, patch, MagicMock

# Basic test
def test_add():
    assert add(2, 3) == 5

# Fixtures
@pytest.fixture
def sample_user():
    return User(name="Alice", email="alice@example.com")

@pytest.fixture
def db_session():
    session = SessionLocal()
    yield session
    session.rollback()
    session.close()

def test_user_creation(sample_user):
    assert sample_user.name == "Alice"

# Parametrized tests
@pytest.mark.parametrize("input,expected", [
    (1, 1),
    (2, 4),
    (3, 9),
    (4, 16),
])
def test_square(input, expected):
    assert square(input) == expected

# Testing exceptions
def test_division_by_zero():
    with pytest.raises(ZeroDivisionError):
        divide(1, 0)

# Mocking
def test_api_call():
    with patch('module.requests.get') as mock_get:
        mock_get.return_value.json.return_value = {"status": "ok"}
        result = fetch_data()
        assert result["status"] == "ok"

# Async tests
@pytest.mark.asyncio
async def test_async_function():
    result = await async_fetch_data()
    assert result is not None

# Class-based mocking
class TestUserService:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.mock_repo = Mock()
        self.service = UserService(self.mock_repo)
    
    def test_get_user(self):
        self.mock_repo.get_by_id.return_value = User(id=1, name="Test")
        user = self.service.get_user(1)
        assert user.name == "Test"
        self.mock_repo.get_by_id.assert_called_once_with(1)
```

### 10.2 Test Coverage

```bash
# Run with coverage
pytest --cov=app --cov-report=html tests/

# Coverage configuration (pyproject.toml)
[tool.coverage.run]
source = ["app"]
omit = ["*/tests/*", "*/__init__.py"]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "raise NotImplementedError",
]
```

---

## 11. Performance Optimization

### 11.1 Profiling

```python
import cProfile
import pstats

# Profile a function
cProfile.run('my_function()', 'output.prof')

# Analyze results
stats = pstats.Stats('output.prof')
stats.sort_stats('cumulative')
stats.print_stats(10)

# Line profiler (pip install line_profiler)
@profile
def my_function():
    # ... code ...
    pass

# Memory profiler (pip install memory_profiler)
@profile
def memory_intensive():
    data = [i ** 2 for i in range(1000000)]
    return data
```

### 11.2 Common Optimizations

```python
# Use generators for large datasets
def process_large_file(filename):
    with open(filename) as f:
        for line in f:  # Generator, not loading all into memory
            yield process_line(line)

# Use collections.deque for queue operations
from collections import deque
queue = deque()
queue.append(item)    # O(1)
queue.popleft()       # O(1)

# Use set for membership testing
items_set = set(items)
if item in items_set:  # O(1) vs O(n) for list
    pass

# Use local variables in tight loops
def fast_function():
    local_func = some_module.function  # Cache lookup
    for item in items:
        local_func(item)

# Use __slots__ for memory optimization
class Point:
    __slots__ = ['x', 'y']
    def __init__(self, x, y):
        self.x = x
        self.y = y

# Use functools.lru_cache for memoization
from functools import lru_cache

@lru_cache(maxsize=128)
def fibonacci(n):
    if n < 2:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
```

---

## 12. Common Interview Questions

### 12.1 Conceptual Questions

1. **What is the GIL and how does it affect multithreading?**
   - GIL is a mutex preventing multiple threads from executing Python bytecode simultaneously
   - Limits CPU-bound multithreading performance
   - Use multiprocessing for CPU-bound tasks

2. **Explain the difference between `__new__` and `__init__`**
   - `__new__` creates the instance (class method)
   - `__init__` initializes the instance (instance method)
   - `__new__` is used for immutable types and singleton pattern

3. **What are metaclasses and when would you use them?**
   - Metaclasses are classes of classes
   - Used for class creation customization
   - Common uses: validation, auto-registration, ORM mapping

4. **Explain Python's memory management**
   - Reference counting + cyclic garbage collector
   - Objects deallocated when refcount reaches 0
   - GC handles circular references

5. **What is the difference between shallow and deep copy?**
   - Shallow copy: Creates new object but references same nested objects
   - Deep copy: Recursively copies all nested objects

### 12.2 Coding Questions

```python
# 1. Implement a LRU Cache
from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = OrderedDict()
    
    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)
        return self.cache[key]
    
    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)

# 2. Implement a rate limiter
import time
from collections import deque

class RateLimiter:
    def __init__(self, max_requests: int, time_window: float):
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = deque()
    
    def allow_request(self) -> bool:
        now = time.time()
        
        # Remove old requests
        while self.requests and self.requests[0] < now - self.time_window:
            self.requests.popleft()
        
        if len(self.requests) < self.max_requests:
            self.requests.append(now)
            return True
        return False

# 3. Implement a thread-safe singleton
import threading

class ThreadSafeSingleton:
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance

# 4. Flatten nested dictionary
def flatten_dict(d: dict, parent_key: str = '', sep: str = '.') -> dict:
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep).items())
        else:
            items.append((new_key, v))
    return dict(items)

# 5. Implement retry decorator with exponential backoff
import time
from functools import wraps

def retry_with_backoff(max_retries: int = 3, base_delay: float = 1.0):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise
                    delay = base_delay * (2 ** attempt)
                    time.sleep(delay)
        return wrapper
    return decorator
```

---

## Quick Reference Card

| Concept | Key Points |
|---------|------------|
| **GIL** | Limits CPU-bound threading; use multiprocessing |
| **Generators** | Lazy evaluation, memory efficient, use `yield` |
| **Decorators** | `@wraps` to preserve metadata |
| **Context Managers** | `__enter__`/`__exit__` or `@contextmanager` |
| **Metaclasses** | `type.__new__` and `type.__init__` |
| **Descriptors** | `__get__`, `__set__`, `__delete__` |
| **Async** | `async`/`await`, `asyncio.gather()` |
| **SQLAlchemy** | `sessionmaker`, `relationship`, eager loading |
| **Testing** | `pytest`, `Mock`, `@pytest.fixture` |

---

*Last updated: January 2026*
