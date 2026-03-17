import { getCriticalPath, getLayers, getPredecessors } from '../src/utils/graphUtils';

describe('graphUtils', () => {
    const sampleTasks = [
        { _id: '1', dependsOn: [] },
        { _id: '2', dependsOn: ['1'] },
        { _id: '3', dependsOn: ['1'] },
        { _id: '4', dependsOn: ['2', '3'] },
        { _id: '5', dependsOn: ['4', 'missing'] },
    ];

    test('builds predecessor map and ignores missing dependencies', () => {
        const { byId, pred } = getPredecessors(sampleTasks);

        expect(byId.has('1')).toBe(true);
        expect(pred.get('2')).toEqual(['1']);
        expect(pred.get('4')).toEqual(['2', '3']);
        expect(pred.get('5')).toEqual(['4']);
    });

    test('computes topological layers', () => {
        const { pred } = getPredecessors(sampleTasks);
        const layers = getLayers(sampleTasks, pred);

        expect(layers.get('1')).toBe(0);
        expect(layers.get('2')).toBe(1);
        expect(layers.get('3')).toBe(1);
        expect(layers.get('4')).toBe(2);
        expect(layers.get('5')).toBe(3);
    });

    test('returns the longest dependency chain as the critical path', () => {
        const { pred } = getPredecessors(sampleTasks);
        const { pathIds, pathEdges } = getCriticalPath(sampleTasks, pred);

        expect(pathIds.has('5')).toBe(true);
        expect(pathIds.has('4')).toBe(true);
        expect(pathIds.has('1')).toBe(true);
        expect(pathIds.has('2') || pathIds.has('3')).toBe(true);
        expect(pathEdges.size).toBe(3);
    });
});
