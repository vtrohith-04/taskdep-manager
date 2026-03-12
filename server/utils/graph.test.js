const { hasCircularDependency } = require('./graph');

describe('Graph Validation Utils', () => {

    test('should prevent self-dependency', () => {
        const taskId = 'task1';
        const newDeps = ['task1'];
        const tasks = [
            { _id: 'task1', dependsOn: [] }
        ];

        const hasCycle = hasCircularDependency(tasks, taskId, newDeps);
        expect(hasCycle).toBe(true);
    });

    test('should allow a typical non-circular dependency chain', () => {
        // task1 -> task2 -> task3
        const tasks = [
            { _id: 'task1', dependsOn: ['task2'] },
            { _id: 'task2', dependsOn: ['task3'] },
            { _id: 'task3', dependsOn: [] }
        ];

        // Let's add task3 -> task4? No, let's say task3 adds a dependency on task4
        const hasCycle = hasCircularDependency(tasks, 'task3', ['task4']);
        expect(hasCycle).toBe(false);
    });

    test('should detect simple circular dependency (A -> B -> A)', () => {
        const tasks = [
            { _id: 'taskA', dependsOn: ['taskB'] },
            { _id: 'taskB', dependsOn: [] }
        ];

        // Suppose taskB wants to depend on taskA
        const hasCycle = hasCircularDependency(tasks, 'taskB', ['taskA']);
        expect(hasCycle).toBe(true);
    });

    test('should detect deep circular dependency (A -> B -> C -> A)', () => {
        const tasks = [
            { _id: 'taskA', dependsOn: ['taskB'] },
            { _id: 'taskB', dependsOn: ['taskC'] },
            { _id: 'taskC', dependsOn: [] }
        ];

        // Task C tries to depend on Task A
        const hasCycle = hasCircularDependency(tasks, 'taskC', ['taskA']);
        expect(hasCycle).toBe(true);
    });

    test('should allow multiple independent dependencies', () => {
        const tasks = [
            { _id: 't1', dependsOn: [] },
            { _id: 't2', dependsOn: [] },
            { _id: 't3', dependsOn: [] },
            { _id: 't4', dependsOn: ['t1', 't2'] }
        ];

        // T4 adding T3 should be fine
        const hasCycle = hasCircularDependency(tasks, 't4', ['t1', 't2', 't3']);
        expect(hasCycle).toBe(false);
    });

});
