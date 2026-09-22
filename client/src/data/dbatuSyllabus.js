/**
 * Dr. Babasaheb Ambedkar Technological University (DBATU), Lonere
 * B.Tech (Computer Science & Engineering / Computer Engineering)
 * Complete Curriculum & Syllabus Scheme (160 Credits)
 */

export const DBATU_CURRICULUM = {
  university: 'Dr. Babasaheb Ambedkar Technological University, Lonere',
  programme: 'B.Tech (Computer Science & Engineering)',
  regulations: '2020-2021 Onwards',
  totalCredits: 160,
  passingCgpa: 5.0,
  minAttendance: 75,
  categories: [
    { code: 'BSC', name: 'Basic Science Course', minCredits: 25 },
    { code: 'ESC', name: 'Engineering Science Course', minCredits: 20 },
    { code: 'HSSMC', name: 'Humanities & Social Science', minCredits: 12 },
    { code: 'PCC', name: 'Professional Core Course', minCredits: 44 },
    { code: 'PEC', name: 'Professional Elective Course', minCredits: 9 },
    { code: 'OEC', name: 'Open Elective Course', minCredits: 6 },
    { code: 'PROJ', name: 'Seminar / Mini Project / Internship', minCredits: 22 },
    { code: 'EMERG', name: 'Emerging Courses', minCredits: 22 },
  ],
  gradingSystem: [
    { range: '91-100%', grade: 'EX', point: 10.0, desc: 'Outstanding' },
    { range: '86-90%', grade: 'AA', point: 9.0, desc: 'Excellent' },
    { range: '81-85%', grade: 'AB', point: 8.5, desc: 'Very Good' },
    { range: '76-80%', grade: 'BB', point: 8.0, desc: 'Good' },
    { range: '71-75%', grade: 'BC', point: 7.5, desc: 'Fair' },
    { range: '66-70%', grade: 'CC', point: 7.0, desc: 'Average' },
    { range: '61-65%', grade: 'CD', point: 6.5, desc: 'Below Average' },
    { range: '56-60%', grade: 'DD', point: 6.0, desc: 'Marginal' },
    { range: '51-55%', grade: 'DE', point: 5.5, desc: 'Pass' },
    { range: '40-50%', grade: 'EE', point: 5.0, desc: 'Minimum Pass' },
    { range: '<40%', grade: 'EF', point: 0.0, desc: 'Fail' },
  ],
  evaluationScheme: {
    theory: { ca: 20, mse: 20, ese: 60, total: 100, minEse: 20, minTotal: 40 },
    practical: { ca: 60, ese: 40, total: 100, minTotal: 40 }
  },
  years: [
    {
      year: 1,
      name: 'First Year (F.Y. B.Tech)',
      semesters: [
        {
          sem: 1,
          credits: 22,
          courses: [
            { code: 'BTBS101', title: 'Engineering Mathematics – I', category: 'BSC', ltp: '3-1-0', credits: 4, ca: 20, mse: 20, ese: 60 },
            { code: 'BTBS102', title: 'Engineering Physics', category: 'BSC', ltp: '3-1-0', credits: 4, ca: 20, mse: 20, ese: 60 },
            { code: 'BTES103', title: 'Engineering Graphics', category: 'ESC', ltp: '2-0-0', credits: 2, ca: 20, mse: 20, ese: 60 },
            { code: 'BTHM104', title: 'Communication Skills', category: 'HSSMC', ltp: '2-0-0', credits: 2, ca: 20, mse: 20, ese: 60 },
            { code: 'BTES105', title: 'Energy & Environment Engineering', category: 'ESC', ltp: '2-0-0', credits: 2, ca: 20, mse: 20, ese: 60 },
            { code: 'BTBS107L', title: 'Engineering Physics Laboratory', category: 'BSC', ltp: '0-0-2', credits: 1, ca: 60, ese: 40 },
            { code: 'BTES108L', title: 'Engineering Graphics Laboratory', category: 'ESC', ltp: '0-0-4', credits: 2, ca: 60, ese: 40 },
            { code: 'BTHM109L', title: 'Communication Skills Laboratory', category: 'HSSMC', ltp: '0-0-2', credits: 1, ca: 60, ese: 40 },
          ]
        },
        {
          sem: 2,
          credits: 21,
          courses: [
            { code: 'BTBS201', title: 'Engineering Mathematics – II', category: 'BSC', ltp: '3-1-0', credits: 4, ca: 20, mse: 20, ese: 60 },
            { code: 'BTBS202', title: 'Engineering Chemistry', category: 'BSC', ltp: '3-1-0', credits: 4, ca: 20, mse: 20, ese: 60 },
            { code: 'BTES203', title: 'Engineering Mechanics', category: 'ESC', ltp: '2-1-0', credits: 3, ca: 20, mse: 20, ese: 60 },
            { code: 'BTES204', title: 'Computer Programming (C Programming)', category: 'ESC', ltp: '3-0-0', credits: 3, ca: 20, mse: 20, ese: 60 },
            { code: 'BTES205', title: 'Workshop Practices', category: 'ESC', ltp: '0-0-4', credits: 2, ca: 60, ese: 40 },
            { code: 'BTBS207L', title: 'Engineering Chemistry Laboratory', category: 'BSC', ltp: '0-0-2', credits: 1, ca: 60, ese: 40 },
            { code: 'BTES208L', title: 'Engineering Mechanics Laboratory', category: 'ESC', ltp: '0-0-2', credits: 1, ca: 60, ese: 40 },
            { code: 'BTES209L', title: 'Basic Computer Programming Laboratory', category: 'ESC', ltp: '0-0-2', credits: 1, ca: 60, ese: 40 },
          ]
        }
      ]
    },
    {
      year: 2,
      name: 'Second Year (S.Y. B.Tech)',
      semesters: [
        {
          sem: 3,
          credits: 24,
          courses: [
            {
              code: 'BTBS301',
              title: 'Engineering Mathematics – III',
              category: 'BSC',
              ltp: '3-1-0',
              credits: 4,
              ca: 20, mse: 20, ese: 60,
              units: [
                { unit: 1, name: 'Laplace Transform', hours: 9, topics: 'Conditions for existence, elementary functions, properties, shifting theorems, derivatives, integrals, Heaviside & Dirac delta.' },
                { unit: 2, name: 'Inverse Laplace Transform', hours: 9, topics: 'Partial fractions, convolution theorem, linear differential equations with constant coefficients.' },
                { unit: 3, name: 'Fourier Transform', hours: 9, topics: 'Fourier integral theorem, Fourier sine and cosine transforms, Parseval’s identity.' },
                { unit: 4, name: 'Partial Differential Equations', hours: 9, topics: 'Formation of PDEs, Lagrange linear equations, separation of variables: 1D heat flow and 1D wave equations.' },
                { unit: 5, name: 'Functions of Complex Variables', hours: 9, topics: 'Analytic functions, Cauchy-Riemann equations, harmonic functions, Cauchy integral theorem & residue theorem.' }
              ],
              books: ['Higher Engineering Mathematics by B.S. Grewal', 'Advanced Engineering Mathematics by Erwin Kreyszig'],
              mooc: [
                { platform: 'NPTEL', name: 'Linear Algebra / Engineering Mathematics', institute: 'IIT Madras', relevance: '90%', url: 'https://nptel.ac.in/courses/111/106/111106051/' }
              ]
            },
            {
              code: 'BTCOC302',
              title: 'Discrete Mathematics',
              category: 'PCC',
              ltp: '3-1-0',
              credits: 4,
              ca: 20, mse: 20, ese: 60,
              units: [
                { unit: 1, name: 'Fundamental Structures & Logic', hours: 7, topics: 'Sets, Venn diagrams, Cartesian products, propositional & predicate logic, mathematical induction, Euclidean algorithm.' },
                { unit: 2, name: 'Functions & Relations', hours: 7, topics: 'Injective, surjective, bijective functions, equivalence relations, combinatorics, recurrence relations.' },
                { unit: 3, name: 'Graph Theory', hours: 7, topics: 'Paths and circuits, Euler & Hamiltonian paths, shortest paths, planar graphs, graph coloring.' },
                { unit: 4, name: 'Trees & Spanning Trees', hours: 7, topics: 'Binary search trees, minimal spanning trees, Kruskal’s and Prim’s algorithms.' },
                { unit: 5, name: 'Algebraic Structures & Boolean Algebra', hours: 7, topics: 'Semigroups, monoids, groups, rings, fields, Boolean algebra, DNF and CNF forms.' }
              ],
              books: ['Elements of Discrete Mathematics by C.L. Liu', 'Discrete Mathematics and Its Applications by Kenneth H. Rosen'],
              mooc: [
                { platform: 'NPTEL', name: 'Discrete Mathematics', institute: 'IIT Madras / IIT Roorkee', relevance: '90%', url: 'https://nptel.ac.in/courses/106/106/106106094/' },
                { platform: 'Coursera', name: 'Discrete Mathematics Specialization', institute: 'UC San Diego / HSE', relevance: '90%', url: 'https://www.coursera.org/specializations/discrete-mathematics' }
              ]
            },
            {
              code: 'BTCOC303',
              title: 'Data Structures',
              category: 'PCC',
              ltp: '3-1-0',
              credits: 4,
              ca: 20, mse: 20, ese: 60,
              units: [
                { unit: 1, name: 'Introduction & Hash Tables', hours: 7, topics: 'ADT, algorithm analysis, sparse matrices, open addressing, hash functions, perfect hashing.' },
                { unit: 2, name: 'Stacks & Queues', hours: 7, topics: 'Stack/Queue ADTs, circular queue, expression evaluation (Infix to Postfix), recursion.' },
                { unit: 3, name: 'Linked Lists', hours: 7, topics: 'Singly, doubly, and circular linked lists, dynamic memory management, garbage collection.' },
                { unit: 4, name: 'Trees & Graphs', hours: 7, topics: 'BST traversal, threaded binary trees, Heaps, AVL trees, graph representations, Warshall’s algorithm.' },
                { unit: 5, name: 'Searching & Sorting', hours: 7, topics: 'Binary search, skip lists, quick sort, merge sort, radix sort, heap sort, file handling.' }
              ],
              books: ['Data Structures and Algorithm Analysis in C++ by Mark Allen Weiss', 'Fundamentals of Data Structures by Horowitz & Sahani'],
              mooc: [
                { platform: 'NPTEL', name: 'Data Structures', institute: 'IIT Delhi', relevance: '90%', url: 'https://nptel.ac.in/courses/106/102/106102064/' },
                { platform: 'edX', name: 'Foundations of Data Structures', institute: 'IIT Bombay', relevance: '90%', url: 'https://www.edx.org/' }
              ]
            },
            {
              code: 'BTCOC304',
              title: 'Computer Architecture & Organization',
              category: 'PCC',
              ltp: '3-1-0',
              credits: 4,
              ca: 20, mse: 20, ese: 60,
              units: [
                { unit: 1, name: 'Introduction & CPU Structure', hours: 7, topics: 'Computer functions, interconnection structures, bus architectures.' },
                { unit: 2, name: 'Instruction Sets & Addressing', hours: 7, topics: 'Operands, addressing modes, instruction formats, RISC vs CISC architecture.' },
                { unit: 3, name: 'Computer Arithmetic', hours: 7, topics: 'ALU design, integer & floating-point arithmetic, IEEE 754 standards.' },
                { unit: 4, name: 'Memory Organization', hours: 7, topics: 'DRAM organization, cache memory mapping, virtual memory, RAID levels.' },
                { unit: 5, name: 'Control Unit & I/O Pipeline', hours: 7, topics: 'Hardwired & micro-programmed control, DMA, pipelining hazards, cache coherence (MESI).' }
              ],
              books: ['Computer Organization and Architecture by William Stallings', 'Computer System Architecture by Morris Mano'],
              mooc: [
                { platform: 'NPTEL', name: 'Computer Architecture', institute: 'IIT Kharagpur', relevance: '85%', url: 'https://nptel.ac.in/courses/106/105/106105163/' }
              ]
            },
            {
              code: 'BTCOC305',
              title: 'Elective – I (OOP in C++ / Java)',
              category: 'PCC',
              ltp: '3-1-0',
              credits: 4,
              ca: 20, mse: 20, ese: 60,
              units: [
                { unit: 1, name: 'Classes & Objects', hours: 7, topics: 'Constructors, destructors, member functions, object references.' },
                { unit: 2, name: 'Inheritance & Polymorphism', hours: 7, topics: 'Single, multiple, hierarchical inheritance, operator overloading, virtual functions.' },
                { unit: 3, name: 'Templates / Interfaces', hours: 7, topics: 'Function & class templates in C++, Interfaces & Abstract classes in Java.' },
                { unit: 4, name: 'Streams, Files & I/O', hours: 7, topics: 'File streams, sequential and random access, formatted I/O.' },
                { unit: 5, name: 'Exception Handling & Collections', hours: 7, topics: 'Try-catch blocks, custom exceptions, Standard Template Library (STL) in C++ / Java Collections Framework.' }
              ],
              books: ['Object Oriented Programming with C++ by E. Balagurusamy', 'Java: The Complete Reference by Herbert Schildt']
            },
            {
              code: 'BTCOL306',
              title: 'Data Structures & OOP Laboratory',
              category: 'PCC',
              ltp: '0-0-4',
              credits: 2,
              ca: 60, ese: 40,
              experiments: [
                '1. Stack implementation using arrays and infix-to-postfix conversion',
                '2. Circular queue and Double-Ended Queue (Deque) operations',
                '3. Singly and Doubly Linked List with reversal and sorting',
                '4. Binary Search Tree (BST) insertion, search, and node deletion',
                '5. AVL Tree height-balancing and deletion',
                '6. Hash Table with Separate Chaining and Linear Probing',
                '7. Sorting comparison: Quick Sort vs Merge Sort vs Heap Sort',
                '8. Graph Traversal: Breadth First Search (BFS) & Depth First Search (DFS)',
                '9. C++/Java operator overloading and inheritance hierarchy',
                '10. STL vector, map, and list container algorithms'
              ]
            },
            { code: 'BTCOS307', title: 'Seminar – I', category: 'PROJ', ltp: '0-0-4', credits: 2, ca: 60, ese: 40 },
            { code: 'BTES211P', title: 'Field Training / Internship – I Evaluation', category: 'PROJ', ltp: '-', credits: 'Audit', ca: 0, ese: 0 }
          ]
        },
        {
          sem: 4,
          credits: 23,
          courses: [
            {
              code: 'BTCOC401',
              title: 'Design & Analysis of Algorithms',
              category: 'PCC',
              ltp: '3-1-0',
              credits: 4,
              ca: 20, mse: 20, ese: 60,
              units: [
                { unit: 1, name: 'Algorithm Analysis & Growth', hours: 7, topics: 'Asymptotic notations (O, Ω, Θ), recurrence relations, Master Theorem, recursion trees.' },
                { unit: 2, name: 'Divide & Conquer', hours: 7, topics: 'Binary search, merge sort, quick sort, Strassen’s matrix multiplication.' },
                { unit: 3, name: 'Backtracking & Branch-and-Bound', hours: 7, topics: 'N-Queens problem, subset sum, graph coloring, 15-puzzle problem, TSP.' },
                { unit: 4, name: 'Greedy Algorithms', hours: 7, topics: 'Knapsack problem, Huffman coding, Kruskal/Prim MST, Dijkstra single-source shortest path.' },
                { unit: 5, name: 'Dynamic Programming & NP-Completeness', hours: 7, topics: 'LCS, matrix chain multiplication, Bellman-Ford, Floyd-Warshall, P vs NP, NP-Hard, NP-Complete reductions.' }
              ],
              books: ['Introduction to Algorithms by Cormen, Leiserson, Rivest, Stein (CLRS)', 'Algorithm Design by Kleinberg & Tardos'],
              mooc: [{ platform: 'NPTEL', name: 'Design and Analysis of Algorithms', institute: 'IIT Kharagpur / CMI', relevance: '90%', url: 'https://nptel.ac.in/' }]
            },
            {
              code: 'BTCOC402',
              title: 'Operating Systems',
              category: 'PCC',
              ltp: '3-1-0',
              credits: 4,
              ca: 20, mse: 20, ese: 60,
              units: [
                { unit: 1, name: 'OS Structures & Services', hours: 7, topics: 'System calls, kernel architectures, process concepts, dual-mode execution.' },
                { unit: 2, name: 'CPU Scheduling & Threads', hours: 7, topics: 'FCFS, SJF, Round Robin, Multilevel feedback queues, POSIX pthreads.' },
                { unit: 3, name: 'Process Synchronization & Deadlocks', hours: 7, topics: 'Critical section, Peterson’s algorithm, Semaphores, Monitors, Bankers deadlock avoidance.' },
                { unit: 4, name: 'Memory Management & Paging', hours: 7, topics: 'Virtual memory, demand paging, page replacement (FIFO, LRU, Optimal, Clock), working set.' },
                { unit: 5, name: 'File Systems & Disk Scheduling', hours: 7, topics: 'File allocation methods, directory structures, disk scheduling (FCFS, SSTF, SCAN, C-SCAN).' }
              ],
              books: ['Operating System Concepts by Silberschatz, Galvin, Gagne', 'Modern Operating Systems by Andrew S. Tanenbaum']
            },
            { code: 'BTHM403', title: 'Basic Human Rights', category: 'HSSMC', ltp: '3-0-0', credits: 3, ca: 20, mse: 20, ese: 60 },
            { code: 'BTBSC404', title: 'Probability and Statistics', category: 'BSC', ltp: '3-0-0', credits: 3, ca: 20, mse: 20, ese: 60 },
            { code: 'BTES405', title: 'Digital Logic Design & Microprocessors', category: 'ESC', ltp: '3-1-0', credits: 4, ca: 20, mse: 20, ese: 60 },
            {
              code: 'BTCOL406',
              title: 'Operating Systems & Python Programming Lab',
              category: 'PCC',
              ltp: '1-0-4',
              credits: 3,
              ca: 60, ese: 40,
              experiments: [
                '1. Unix shell scripting, text processing (grep, awk, sed)',
                '2. CPU scheduling algorithm simulation in C (FCFS, SJF, Priority, RR)',
                '3. POSIX pthread concurrent matrix multiplication',
                '4. Semaphore synchronization: Producer-Consumer & Readers-Writers',
                '5. Banker’s Algorithm for deadlock avoidance',
                '6. Page replacement simulation: FIFO, LRU, Optimal',
                '7. Python data structures: lists, dicts, tuples, list comprehensions',
                '8. SQLite database connectivity and CRUD operations in Python',
                '9. Web scraping with BeautifulSoup and JSON REST API client',
                '10. Python OS process management and file system automation'
              ]
            },
            { code: 'BTCOS407', title: 'Seminar – II (Web Technologies & Seminar)', category: 'PROJ', ltp: '0-0-4', credits: 2, ca: 60, ese: 40 },
            { code: 'BTCOF408', title: 'Field Training / Industrial Training – II', category: 'PROJ', ltp: '-', credits: 'Audit', ca: 0, ese: 0 }
          ]
        }
      ]
    },
    {
      year: 3,
      name: 'Third Year (T.Y. B.Tech)',
      semesters: [
        {
          sem: 5,
          credits: 22,
          courses: [
            {
              code: 'BTCOC501',
              title: 'Database Systems',
              category: 'PCC',
              ltp: '3-1-0',
              credits: 4,
              ca: 20, mse: 20, ese: 60,
              units: [
                { unit: 1, name: 'ER Modeling & Relational Model', hours: 7, topics: 'Entity-relationship diagrams, constraints, relational algebra, relational calculus.' },
                { unit: 2, name: 'SQL & Query Processing', hours: 7, topics: 'DDL, DML, complex joins, nested subqueries, views, triggers, stored procedures.' },
                { unit: 3, name: 'Normalization & Schema Design', hours: 7, topics: 'Functional dependencies, 1NF, 2NF, 3NF, BCNF, 4NF, lossless decomposition.' },
                { unit: 4, name: 'Indexing & Storage', hours: 7, topics: 'B+ Tree indices, static & dynamic hashing, query cost estimation.' },
                { unit: 5, name: 'Transaction Management & ACID', hours: 7, topics: 'ACID properties, serializability, 2-phase locking, deadlock handling, WAL recovery.' }
              ],
              books: ['Database System Concepts by Korth, Silberschatz, Sudarshan', 'Database Management Systems by Raghu Ramakrishnan']
            },
            {
              code: 'BTCOC502',
              title: 'Theory of Computation',
              category: 'PCC',
              ltp: '3-1-0',
              credits: 4,
              ca: 20, mse: 20, ese: 60,
              units: [
                { unit: 1, name: 'Finite Automata & Regular Languages', hours: 7, topics: 'DFA, NFA with ε-moves, regular expressions, Pumping Lemma for regular sets.' },
                { unit: 2, name: 'Context-Free Grammars', hours: 7, topics: 'CFG definitions, derivation trees, ambiguity removal, Chomsky hierarchy.' },
                { unit: 3, name: 'Pushdown Automata (PDA)', hours: 7, topics: 'DPDA vs NPDA, acceptance by empty stack/final state, CFG to PDA equivalence, CNF/GNF.' },
                { unit: 4, name: 'Turing Machines', hours: 7, topics: 'Turing machine formal model, transition diagrams, multi-tape TMs, Church-Turing thesis.' },
                { unit: 5, name: 'Undecidability & Halting Problem', hours: 7, topics: 'Universal Turing Machine, Halting problem, Post Correspondence Problem (PCP), Rice theorem.' }
              ],
              books: ['Introduction to Automata Theory, Languages, and Computation by Hopcroft, Motwani, Ullman']
            },
            {
              code: 'BTCOC503',
              title: 'Software Engineering',
              category: 'PCC',
              ltp: '3-1-0',
              credits: 4,
              ca: 20, mse: 20, ese: 60,
              units: [
                { unit: 1, name: 'Process Models & RUP', hours: 7, topics: 'Waterfall, Iterative, Evolutionary, Rational Unified Process (RUP).' },
                { unit: 2, name: 'Agile Methodologies & Scrum', hours: 7, topics: 'Scrum, Sprint planning, user stories, XP, Kanban, Agile estimation.' },
                { unit: 3, name: 'Requirements Engineering & UML', hours: 7, topics: 'SRS document, use case diagrams, class diagrams, sequence diagrams, state-chart diagrams.' },
                { unit: 4, name: 'Design Patterns & Architecture', hours: 7, topics: 'GoF design patterns (Singleton, Factory, Observer, MVC), microservices architecture.' },
                { unit: 5, name: 'Testing & CI/CD', hours: 7, topics: 'Unit testing, integration testing, TDD, automated testing, DevOps pipelines.' }
              ],
              books: ['Software Engineering by Ian Sommerville', 'Software Engineering: A Practitioner’s Approach by Roger Pressman']
            },
            {
              code: 'BTCOE504',
              title: 'Professional Elective – II (HCI / Numerical Methods)',
              category: 'PEC',
              ltp: '3-0-0',
              credits: 3,
              ca: 20, mse: 20, ese: 60
            },
            {
              code: 'BTHM505',
              title: 'Humanities Elective – III (Economics & Mgmt / Business Comm)',
              category: 'HSSMC',
              ltp: '3-0-0',
              credits: 3,
              ca: 20, mse: 20, ese: 60
            },
            {
              code: 'BTCOL506',
              title: 'DBMS & Software Engineering Lab',
              category: 'PCC',
              ltp: '0-0-4',
              credits: 2,
              ca: 60, ese: 40,
              experiments: [
                '1. DDL & DML Schema design with Foreign Keys and integrity constraints',
                '2. Advanced SQL joins, nested subqueries, and aggregate functions',
                '3. PL/SQL Stored Procedures, Functions, and Cursors',
                '4. Database Triggers for automated audit logging',
                '5. Mini database project normalization to BCNF (Hotel/Hospital Management)',
                '6. Software Requirements Specification (SRS) preparation using IEEE standards',
                '7. UML Modeling: Use Case, Class, Sequence, and Activity diagrams in StarUML',
                '8. Unit and Integration testing using JUnit / Jest test runners'
              ]
            },
            { code: 'BTCOM507', title: 'Mini-project – I', category: 'PROJ', ltp: '0-0-4', credits: 2, ca: 60, ese: 40 }
          ]
        },
        {
          sem: 6,
          credits: 23,
          courses: [
            {
              code: 'BTCOC601',
              title: 'Compiler Design',
              category: 'PCC',
              ltp: '3-1-0',
              credits: 4,
              ca: 20, mse: 20, ese: 60,
              units: [
                { unit: 1, name: 'Lexical Analysis', hours: 7, topics: 'Token specification, Lexical analyzer generators (LEX/FLEX), transition diagrams.' },
                { unit: 2, name: 'Syntax Analysis & Parsing', hours: 7, topics: 'Top-down parsing (LL(1)), Bottom-up parsing (LR(0), SLR(1), LALR(1), YACC/BISON).' },
                { unit: 3, name: 'Syntax-Directed Translation (SDT)', hours: 7, topics: 'Syntax trees, S-attributed and L-attributed definitions, Intermediate Code (3-address code).' },
                { unit: 4, name: 'Runtime Environments & Storage', hours: 7, topics: 'Activation records, stack allocation, symbol table management.' },
                { unit: 5, name: 'Code Optimization & Generation', hours: 7, topics: 'Basic blocks, DAG representation, loop optimization, dead code elimination, register allocation.' }
              ],
              books: ['Compilers: Principles, Techniques, and Tools (Dragon Book) by Aho, Lam, Sethi, Ullman']
            },
            {
              code: 'BTCOC602',
              title: 'Computer Networks',
              category: 'PCC',
              ltp: '3-1-0',
              credits: 4,
              ca: 20, mse: 20, ese: 60,
              units: [
                { unit: 1, name: 'Network Models & Physical Layer', hours: 7, topics: 'OSI 7-layer vs TCP/IP models, bandwidth, delay-bandwidth product, transmission media.' },
                { unit: 2, name: 'Data Link Layer & MAC', hours: 7, topics: 'Framing, CRC error detection, sliding window protocols, Ethernet (802.3), Wi-Fi (802.11).' },
                { unit: 3, name: 'Network Layer & Routing', hours: 7, topics: 'IPv4/IPv6 addressing, subnetting, CIDR, Distance Vector vs Link State routing (OSPF, BGP).' },
                { unit: 4, name: 'Transport Layer Protocols', hours: 7, topics: 'TCP 3-way handshake, congestion control (AIMD), flow control (sliding window), UDP socket programming.' },
                { unit: 5, name: 'Application Layer & Network Security', hours: 7, topics: 'DNS, HTTP/HTTPS, SMTP, TLS/SSL, firewalls, public key cryptography (RSA).' }
              ],
              books: ['Computer Networks by Andrew S. Tanenbaum', 'Data Communications and Networking by Behrouz Forouzan']
            },
            {
              code: 'BTCOC603',
              title: 'Machine Learning',
              category: 'EMERG',
              ltp: '3-1-0',
              credits: 4,
              ca: 20, mse: 20, ese: 60,
              units: [
                { unit: 1, name: 'Foundations & Supervised Learning', hours: 7, topics: 'Linear regression, polynomial regression, logistic regression, bias-variance tradeoff.' },
                { unit: 2, name: 'Decision Trees & Ensembles', hours: 7, topics: 'ID3, C4.5, Random Forests, Gradient Boosted Trees (XGBoost), AdaBoost.' },
                { unit: 3, name: 'Support Vector Machines & Kernels', hours: 7, topics: 'Maximum margin classifiers, soft margin SVM, RBF kernel, polynomial kernel.' },
                { unit: 4, name: 'Unsupervised Learning & Clustering', hours: 7, topics: 'K-Means, hierarchical clustering, Gaussian Mixture Models, PCA dimensionality reduction.' },
                { unit: 5, name: 'Neural Networks & Deep Learning', hours: 7, topics: 'Multilayer perceptrons, backpropagation algorithm, CNNs, regularization, dropout.' }
              ],
              books: ['Machine Learning by Tom Mitchell', 'Introduction to Machine Learning by Ethem Alpaydin'],
              mooc: [{ platform: 'NPTEL', name: 'Machine Learning', institute: 'IIT Kharagpur', relevance: '100%', url: 'https://nptel.ac.in/' }]
            },
            {
              code: 'BTCOE604',
              title: 'Professional Elective – IV (GIS / IoT / Embedded Systems)',
              category: 'PEC',
              ltp: '3-0-0',
              credits: 3,
              ca: 20, mse: 20, ese: 60
            },
            {
              code: 'BTHM605',
              title: 'Humanities Elective – V (Dev Engg / Soft Skills / Consumer Behavior)',
              category: 'HSSMC',
              ltp: '3-0-0',
              credits: 3,
              ca: 20, mse: 20, ese: 60
            },
            {
              code: 'BTCOL606',
              title: 'Competitive Programming & ML Lab',
              category: 'PCC',
              ltp: '1-0-4',
              credits: 3,
              ca: 60, ese: 40,
              experiments: [
                '1. Competitive programming: The 3n + 1 Problem & Minesweeper simulation',
                '2. Fast I/O, bit manipulation, and modular arithmetic algorithms',
                '3. String algorithms: KMP pattern matching & trie prefix trees',
                '4. Linear Regression and Polynomial curve fitting with Scikit-learn',
                '5. Logistic Regression for binary classification and ROC-AUC evaluation',
                '6. Random Forest classifier with hyperparameter tuning',
                '7. K-Means clustering and Elbow method analysis on customer datasets',
                '8. Deep Neural Network implementation with PyTorch / TensorFlow'
              ]
            },
            { code: 'BTCOM607', title: 'Mini-project – II', category: 'PROJ', ltp: '0-0-4', credits: 2, ca: 60, ese: 40 }
          ]
        }
      ]
    },
    {
      year: 4,
      name: 'Final Year (Final B.Tech)',
      semesters: [
        {
          sem: 7,
          credits: 19,
          courses: [
            {
              code: 'BTCOC701',
              title: 'Artificial Intelligence',
              category: 'EMERG',
              ltp: '3-0-0',
              credits: 3,
              ca: 20, mse: 20, ese: 60,
              units: [
                { unit: 1, name: 'Intelligent Agents & Problem Solving', hours: 7, topics: 'Agent architectures, uninformed search (BFS, DFS), heuristic search (A*, IDA*).' },
                { unit: 2, name: 'Constraint Satisfaction & Adversarial Search', hours: 7, topics: 'CSP, Minimax algorithm, Alpha-Beta pruning in game playing.' },
                { unit: 3, name: 'Knowledge Representation & Logic', hours: 7, topics: 'First-order logic, resolution theorem proving, forward & backward chaining, semantic networks.' },
                { unit: 4, name: 'Probabilistic Reasoning & Planning', hours: 7, topics: 'Bayesian networks, Dempster-Shafer theory, STRIPS planning, Goal Stack planning.' },
                { unit: 5, name: 'Natural Language Processing & Expert Systems', hours: 7, topics: 'Syntactic parsing, n-gram models, transformer basics, expert system inference engines.' }
              ],
              books: ['Artificial Intelligence: A Modern Approach by Stuart Russell & Peter Norvig']
            },
            {
              code: 'BTCOC702',
              title: 'Cloud Computing',
              category: 'EMERG',
              ltp: '3-0-0',
              credits: 3,
              ca: 20, mse: 20, ese: 60,
              units: [
                { unit: 1, name: 'Cloud Fundamentals & Virtualization', hours: 7, topics: 'NIST cloud model, hypervisors (KVM, VMware, Xen), containerization (Docker, Kubernetes).' },
                { unit: 2, name: 'Service Models (IaaS, PaaS, SaaS)', hours: 7, topics: 'AWS EC2, S3, Google App Engine, Azure serverless functions, multi-tenant architectures.' },
                { unit: 3, name: 'Cloud Storage & Databases', hours: 7, topics: 'Distributed object storage, NoSQL databases (DynamoDB, MongoDB), cloud database replication.' },
                { unit: 4, name: 'Cloud Security & SLA Management', hours: 7, topics: 'Shared responsibility model, IAM policies, encryption at rest/transit, SLA guarantees.' },
                { unit: 5, name: 'Industry Cloud Platforms & DevOps', hours: 7, topics: 'Infrastructure as Code (Terraform), auto-scaling, cloud monitoring, edge computing.' }
              ],
              books: ['Mastering Cloud Computing by Rajkumar Buyya', 'Cloud Application Architectures by George Reese']
            },
            {
              code: 'BTCOE703',
              title: 'Professional Elective – VI (Bioinformatics / Distributed Systems / Big Data)',
              category: 'PEC',
              ltp: '3-0-0',
              credits: 3,
              ca: 20, mse: 20, ese: 60
            },
            {
              code: 'BTCOE704',
              title: 'Open Elective – VII (Cryptography / BI / Blockchain)',
              category: 'OEC',
              ltp: '3-0-0',
              credits: 3,
              ca: 20, mse: 20, ese: 60
            },
            {
              code: 'BTCOE705',
              title: 'Open Elective – VIII (VR / Deep Learning / Design Thinking)',
              category: 'OEC',
              ltp: '3-0-0',
              credits: 3,
              ca: 20, mse: 20, ese: 60
            },
            {
              code: 'BTCOL707',
              title: 'AI & Cloud Computing Lab',
              category: 'PCC',
              ltp: '0-0-4',
              credits: 2,
              ca: 60, ese: 40,
              experiments: [
                '1. PROLOG programming for logical knowledge bases',
                '2. A* Search and 8-Puzzle Problem solver in Python',
                '3. Alpha-Beta Pruning implementation for Tic-Tac-Toe',
                '4. Deploying web application on AWS EC2 & S3 bucket',
                '5. Multi-container orchestration using Docker Compose',
                '6. Serverless REST API with AWS Lambda and API Gateway',
                '7. Kubernetes cluster pod deployment and service load balancing'
              ]
            },
            { code: 'BTCOS708', title: 'Project Phase – I', category: 'PROJ', ltp: '-', credits: 2, ca: 60, ese: 40 },
            { code: 'BTHM706', title: 'Foreign Language Studies', category: 'HSSMC', ltp: '0-0-4', credits: 'Audit', ca: 0, ese: 0 }
          ]
        },
        {
          sem: 8,
          credits: 12,
          courses: [
            {
              code: 'BTCOF801',
              title: 'Project Phase – II (In-House) / Industry Internship & Project',
              category: 'PROJ',
              ltp: '0-0-24',
              credits: 12,
              ca: 60, ese: 40,
              description: 'Full-semester industry immersion or comprehensive in-house capstone development with department and industry joint evaluation.'
            }
          ]
        }
      ]
    }
  ]
};
