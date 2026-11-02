"""Static technical-prep catalog and a curated fallback MCQ bank.

The AI generates fresh quizzes on demand; this bank keeps quizzes working
when the LLM is unavailable, and seeds the nine prep categories the UI shows.
"""

TOPICS: list[dict] = [
    {
        "id": "c-cpp",
        "name": "C & C++",
        "description": "Pointers, memory management, classes, templates and the STL basics interviewers love to probe.",
        "subtopics": ["Pointers & memory", "Arrays & strings", "Functions", "Structs & unions", "Classes & objects", "STL basics"],
    },
    {
        "id": "python",
        "name": "Python",
        "description": "Core language behavior, data structures, decorators and the idioms that separate users from understanders.",
        "subtopics": ["Data types", "Comprehensions", "Functions & decorators", "OOP in Python", "Modules & packages", "Error handling"],
    },
    {
        "id": "dsa",
        "name": "Data Structures & Algorithms",
        "description": "Complexity analysis, classic structures and the patterns behind most placement coding rounds.",
        "subtopics": ["Arrays & strings", "Linked lists", "Stacks & queues", "Trees & graphs", "Hashing", "Sorting & searching", "Recursion & DP"],
    },
    {
        "id": "oop",
        "name": "Object-Oriented Programming",
        "description": "The four pillars, design trade-offs and how they show up in real codebases.",
        "subtopics": ["Encapsulation", "Inheritance", "Polymorphism", "Abstraction", "Design principles"],
    },
    {
        "id": "dbms-sql",
        "name": "DBMS & SQL",
        "description": "Relational modeling, normalization, joins, indexes and transaction semantics.",
        "subtopics": ["ER modeling", "Normalization", "SQL joins", "Indexes", "Transactions & ACID", "NoSQL basics"],
    },
    {
        "id": "operating-systems",
        "name": "Operating Systems",
        "description": "Processes, scheduling, synchronization, deadlocks and memory management fundamentals.",
        "subtopics": ["Processes & threads", "Scheduling", "Synchronization", "Deadlocks", "Memory management", "File systems"],
    },
    {
        "id": "computer-networks",
        "name": "Computer Networks",
        "description": "OSI/TCP-IP layers, protocols and the client-server conversations behind every app.",
        "subtopics": ["OSI & TCP/IP", "HTTP/HTTPS", "TCP vs UDP", "DNS", "Routing basics", "Network security"],
    },
    {
        "id": "software-engineering",
        "name": "Software Engineering",
        "description": "SDLC, version control, testing and API design habits that make freshers stand out.",
        "subtopics": ["SDLC & agile", "Version control", "Testing", "API design", "Code quality", "System design basics"],
    },
    {
        "id": "ai-ml-fundamentals",
        "name": "AI & Machine Learning",
        "description": "Core ML vocabulary, model evaluation and the concepts behind intelligent systems.",
        "subtopics": ["ML terminology", "Supervised learning", "Unsupervised learning", "Evaluation metrics", "Neural network basics"],
    },
]

FALLBACK_BANK: dict[str, list[dict]] = {
    "c-cpp": [
        {"question": "In C, which header must you include to use malloc()?", "options": ["stdio.h", "stdlib.h", "string.h", "assert.h"], "correct_index": 1, "explanation": "malloc() and free() are declared in <stdlib.h>.", "difficulty": "easy"},
        {"question": "What does a segmentation fault most commonly indicate?", "options": ["A syntax error caught at compile time", "Accessing memory your program does not own", "Returning the wrong value from main", "Using too many comments"], "correct_index": 1, "explanation": "A segfault happens at runtime when the program touches memory outside its permitted regions — e.g. dereferencing a bad pointer or overflowing a buffer.", "difficulty": "easy"},
        {"question": "In C++, what does the `virtual` keyword enable when used on a base-class method?", "options": ["Compile-time binding", "Runtime polymorphism through the vtable", "Automatic garbage collection", "Operator overloading"], "correct_index": 1, "explanation": "Virtual dispatch lets the derived-class override be selected at runtime via the vtable — the heart of runtime polymorphism.", "difficulty": "medium"},
        {"question": "Which of these C++ features does C NOT have?", "options": ["Pointers", "Structs", "Classes with member functions", "Loops"], "correct_index": 2, "explanation": "C structs hold data only; C++ classes bundle data with member functions, access specifiers and constructors.", "difficulty": "easy"},
        {"question": "What is the value of sizeof(char) on virtually all modern platforms?", "options": ["0", "1", "2", "4"], "correct_index": 1, "explanation": "By definition sizeof(char) is always 1 — other sizes are measured in char units.", "difficulty": "easy"},
    ],
    "python": [
        {"question": "What does Python's Global Interpreter Lock (GIL) do?", "options": ["It encrypts Python source files", "It allows only one thread to execute Python bytecode at a time", "It automatically parallelizes loops", "It locks files opened for writing"], "correct_index": 1, "explanation": "The GIL serializes bytecode execution across threads of one process; CPU-bound code uses multiprocessing instead of threads.", "difficulty": "medium"},
        {"question": "Which of the following is mutable in Python?", "options": ["tuple", "str", "list", "bytes"], "correct_index": 2, "explanation": "Lists can be changed in place; tuples, strings and bytes are immutable.", "difficulty": "easy"},
        {"question": "What does d.get('key', 0) return when 'key' is not in dict d?", "options": ["KeyError", "None", "0", "False"], "correct_index": 2, "explanation": "get() returns the supplied default (here 0) instead of raising KeyError like d['key'] would.", "difficulty": "easy"},
        {"question": "What is a decorator in Python?", "options": ["A comment that documents a function", "A callable that wraps another function to extend its behavior", "A special kind of class attribute", "A tool that formats code"], "correct_index": 1, "explanation": "@decorator syntax passes the function through a wrapper callable, extending behavior without modifying it.", "difficulty": "medium"},
        {"question": "What is the average time complexity of checking `x in some_list` for a Python list?", "options": ["O(1)", "O(log n)", "O(n)", "O(n log n)"], "correct_index": 2, "explanation": "Membership on a list is a linear scan; a set or dict gives O(1) average lookups.", "difficulty": "easy"},
    ],
    "dsa": [
        {"question": "What is the worst-case time complexity of quicksort?", "options": ["O(n log n)", "O(n)", "O(n^2)", "O(log n)"], "correct_index": 2, "explanation": "Poor pivot choices (e.g. sorted input with a first-element pivot) degrade quicksort to O(n^2); random pivots make this unlikely.", "difficulty": "medium"},
        {"question": "Which data structure does Breadth-First Search (BFS) use?", "options": ["Stack", "Queue", "Heap", "Trie"], "correct_index": 1, "explanation": "BFS explores level by level using a FIFO queue; DFS uses a stack (or recursion).", "difficulty": "easy"},
        {"question": "What is the average time complexity of a lookup in a well-designed hash map?", "options": ["O(1)", "O(log n)", "O(n)", "O(n^2)"], "correct_index": 0, "explanation": "Hashing maps a key straight to a bucket for average constant-time lookup; collisions are handled by chaining or probing.", "difficulty": "easy"},
        {"question": "An in-order traversal of a Binary Search Tree returns nodes in…", "options": ["Reverse order", "Sorted order", "Insertion order", "Random order"], "correct_index": 1, "explanation": "Left-root-right traversal of a BST visits keys in ascending sorted order.", "difficulty": "easy"},
        {"question": "Which sorting algorithm is stable and guarantees O(n log n) in the worst case?", "options": ["Quicksort", "Heapsort", "Merge sort", "Selection sort"], "correct_index": 2, "explanation": "Merge sort is stable with guaranteed O(n log n); quicksort is unstable with O(n^2) worst case, heapsort is unstable.", "difficulty": "medium"},
    ],
    "oop": [
        {"question": "Encapsulation is best described as…", "options": ["Copying one object into another", "Bundling data with the methods that operate on it while restricting direct access", "Creating many forms of one method", "Inheriting from two base classes"], "correct_index": 1, "explanation": "Encapsulation hides internal state behind a controlled interface (getters/setters, private fields).", "difficulty": "easy"},
        {"question": "What is the difference between method overloading and overriding?", "options": ["They are identical", "Overloading redefines an inherited method; overriding means same name, different parameters", "Overloading means same name, different parameters; overriding redefines an inherited method", "Overriding only works with static methods"], "correct_index": 2, "explanation": "Overloading = same name, different signatures (compile time). Overriding = child re-implements an inherited method (runtime).", "difficulty": "medium"},
        {"question": "An abstract class differs from an interface mainly because an abstract class…", "options": ["Cannot contain any implemented methods", "Can provide shared state and implemented methods alongside abstract ones", "Supports multiple inheritance in Java", "Cannot be inherited"], "correct_index": 1, "explanation": "Abstract classes can mix concrete fields/methods with abstract members; classic interfaces describe pure contracts.", "difficulty": "medium"},
        {"question": "Which relationship does inheritance model?", "options": ["HAS-A", "IS-A", "USES-A", "PART-OF"], "correct_index": 1, "explanation": "A subclass IS-A supertype; HAS-A is composition, which is often preferable.", "difficulty": "easy"},
        {"question": "The diamond problem in multiple inheritance is traditionally resolved using…", "options": ["Name mangling", "Virtual inheritance", "Function templates", "Copy constructors"], "correct_index": 1, "explanation": "Virtual inheritance keeps a single shared base subobject; Python resolves it with a deterministic MRO instead.", "difficulty": "hard"},
    ],
    "dbms-sql": [
        {"question": "Which normal form eliminates partial dependencies on a composite primary key?", "options": ["1NF", "2NF", "3NF", "BCNF"], "correct_index": 1, "explanation": "2NF requires every non-key attribute to depend on the whole key; 3NF then removes transitive dependencies.", "difficulty": "medium"},
        {"question": "What is a key difference between DELETE and TRUNCATE?", "options": ["DELETE is faster than TRUNCATE", "TRUNCATE removes all rows as a DDL operation and cannot filter with WHERE", "DELETE cannot be rolled back", "TRUNCATE can delete specific rows with a WHERE clause"], "correct_index": 1, "explanation": "DELETE is row-wise DML with optional WHERE; TRUNCATE deallocates all rows at once and resets identity counters.", "difficulty": "medium"},
        {"question": "In SQL, HAVING differs from WHERE because HAVING…", "options": ["Filters rows before grouping", "Filters groups after aggregation", "Only works on strings", "Is faster in all cases"], "correct_index": 1, "explanation": "WHERE filters individual rows before grouping; HAVING filters the aggregated groups afterwards.", "difficulty": "easy"},
        {"question": "What is the main trade-off of adding an index to a table?", "options": ["It makes all queries slower", "Reads get faster but writes take longer and storage grows", "It removes duplicate rows", "It locks the table permanently"], "correct_index": 1, "explanation": "Every INSERT/UPDATE/DELETE must also maintain the index structure, and the index consumes extra disk.", "difficulty": "easy"},
        {"question": "In ACID properties, Isolation means…", "options": ["Data cannot be lost after a crash", "Concurrent transactions do not see each other's intermediate states", "Every transaction is a single SQL statement", "Foreign keys always match"], "correct_index": 1, "explanation": "Isolation levels (read committed, serializable…) control how much concurrent transactions can observe of each other.", "difficulty": "medium"},
    ],
    "operating-systems": [
        {"question": "Which four conditions must hold simultaneously for deadlock to occur?", "options": ["Spooling, buffering, caching, paging", "Mutual exclusion, hold and wait, no preemption, circular wait", "Loading, linking, relocation, execution", "Fetch, decode, execute, writeback"], "correct_index": 1, "explanation": "Coffman conditions — breaking any one of them prevents deadlock.", "difficulty": "medium"},
        {"question": "Thrashing refers to…", "options": ["Excessive page faults that cost more time than the actual execution", "A CPU fan running at maximum speed", "Overwriting read-only memory", "Compiling with too many warnings"], "correct_index": 0, "explanation": "When the working set exceeds physical memory, the system spends most of its time swapping pages instead of doing work.", "difficulty": "medium"},
        {"question": "During a context switch, the OS…", "options": ["Terminates the current process", "Saves the current process state and restores another process's saved state", "Swaps the CPU cache to disk", "Recompiles the process"], "correct_index": 1, "explanation": "Registers, program counter and memory mappings are saved to the PCB so the process can resume later.", "difficulty": "easy"},
        {"question": "A binary semaphore is commonly used to…", "options": ["Encrypt memory pages", "Enforce mutual exclusion between threads", "Schedule CPU cache lines", "Compress page tables"], "correct_index": 1, "explanation": "A semaphore initialized to 1 acts as a lock: only one holder may enter the critical section at a time.", "difficulty": "easy"},
        {"question": "Virtual memory allows…", "options": ["The CPU to run multiple instructions per cycle", "Processes to use a larger address space than physical RAM by paging to disk", "Disks to store files compressed", "RAM to run without a power supply"], "correct_index": 1, "explanation": "Each process gets its own address space; pages are transparently moved between RAM and disk.", "difficulty": "easy"},
    ],
    "computer-networks": [
        {"question": "Which statement about TCP vs UDP is correct?", "options": ["UDP is reliable and ordered; TCP is not", "TCP provides reliable, ordered delivery; UDP is connectionless and best-effort", "Both guarantee delivery", "Neither uses ports"], "correct_index": 1, "explanation": "TCP adds handshakes, acknowledgements and retransmission; UDP trades guarantees for lower latency.", "difficulty": "easy"},
        {"question": "HTTP operates primarily at which OSI layer?", "options": ["Transport", "Network", "Application", "Data link"], "correct_index": 2, "explanation": "HTTP is an application-layer protocol, riding on TCP at the transport layer.", "difficulty": "easy"},
        {"question": "What does DNS do?", "options": ["Assigns MAC addresses", "Resolves domain names to IP addresses", "Encrypts HTTP traffic", "Routes packets between subnets"], "correct_index": 1, "explanation": "DNS is the internet's phone book, translating names like example.com into routable IPs.", "difficulty": "easy"},
        {"question": "What is the correct order of TCP's three-way handshake?", "options": ["ACK, SYN, SYN-ACK", "SYN, ACK, SYN-ACK", "SYN, SYN-ACK, ACK", "SYN-ACK, SYN, ACK"], "correct_index": 2, "explanation": "Client SYN, server SYN-ACK, client ACK — establishing sequence numbers on both sides.", "difficulty": "medium"},
        {"question": "An HTTP status code in the 4xx range indicates…", "options": ["A server-side failure", "A client-side error such as a bad request or missing resource", "A successful response", "A redirect"], "correct_index": 1, "explanation": "4xx = the client did something wrong (404 not found, 401 unauthorized); 5xx means the server failed.", "difficulty": "easy"},
    ],
    "software-engineering": [
        {"question": "A unit test verifies that…", "options": ["The whole deployed system works end to end", "The smallest testable part of an application works in isolation", "The database schema is correct", "The UI looks pixel-perfect"], "correct_index": 1, "explanation": "Unit tests exercise one function/class with dependencies stubbed; broader coverage comes from integration and E2E tests.", "difficulty": "easy"},
        {"question": "Which HTTP method is idempotent but NOT safe (it can change server state)?", "options": ["GET", "POST", "PUT", "OPTIONS"], "correct_index": 2, "explanation": "PUT applied repeatedly yields the same resource state (idempotent) but modifies data, so it is not safe like GET.", "difficulty": "medium"},
        {"question": "A key benefit of code review is…", "options": ["It replaces testing entirely", "Early defect detection plus shared knowledge of the codebase", "It guarantees zero bugs", "It removes the need for version control"], "correct_index": 1, "explanation": "Reviews catch issues before merge and spread ownership knowledge across the team.", "difficulty": "easy"},
        {"question": "In Git, what does `git rebase` do?", "options": ["Merges two unrelated repositories", "Replays your commits on top of another branch to create a linear history", "Deletes remote branches", "Signs commits cryptographically"], "correct_index": 1, "explanation": "Rebase rewrites your branch's commits onto the new base, producing a linear history instead of a merge commit.", "difficulty": "medium"},
        {"question": "Technical debt refers to…", "options": ["Money owed to cloud providers", "The future cost caused by choosing an easy-but-suboptimal solution now", "Bugs found only in production", "Licenses for proprietary tools"], "correct_index": 1, "explanation": "Quick shortcuts accumulate interest: later features cost more until the debt is paid down by refactoring.", "difficulty": "easy"},
    ],
    "ai-ml-fundamentals": [
        {"question": "Overfitting happens when a model…", "options": ["Performs poorly on both training and test data", "Memorizes training data and generalizes poorly to unseen data", "Trains too quickly", "Has too little capacity for the data"], "correct_index": 1, "explanation": "The model latches onto noise in the training set; regularization, more data or simpler models counteract it.", "difficulty": "easy"},
        {"question": "The core difference between supervised and unsupervised learning is…", "options": ["Supervised uses labeled data; unsupervised finds patterns in unlabeled data", "Supervised is always faster", "Unsupervised requires GPUs", "They are identical"], "correct_index": 0, "explanation": "Supervised learns input→label mappings; unsupervised discovers structure like clusters without labels.", "difficulty": "easy"},
        {"question": "Precision is defined as…", "options": ["TP / (TP + FN)", "TP / (TP + FP)", "(TP + TN) / total", "FP / (FP + TN)"], "correct_index": 1, "explanation": "Precision answers: of everything predicted positive, how much actually was? Recall is TP/(TP+FN).", "difficulty": "medium"},
        {"question": "The bias–variance trade-off describes…", "options": ["The balance between model flexibility and its tendency to overfit vs underfit", "Hardware cost vs accuracy", "Training time vs dataset size", "Learning rate vs batch size"], "correct_index": 0, "explanation": "More flexible models lower bias but raise variance; the goal is the sweet spot that minimizes total error.", "difficulty": "medium"},
        {"question": "The main purpose of a held-out test set is to…", "options": ["Speed up training", "Estimate how the model performs on data it has never seen", "Increase model size", "Choose the learning rate"], "correct_index": 1, "explanation": "Keeping data out of training gives an unbiased estimate of real-world generalization.", "difficulty": "easy"},
    ],
}
