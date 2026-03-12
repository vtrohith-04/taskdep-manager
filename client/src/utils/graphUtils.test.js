import { describe, it, expect } from 'vitest';
import { getPredecessors, getLayers, getCriticalPath } from './graphUtils';

describe('Graph Utilities', () => {

    const sampleTasks = [
        { _id: '1', dependsOn: [] },
        { _id: '2', dependsOn: ['1'] },
        { _id: '3', dependsOn: ['1'] },
        { _id: '4', dependsOn: ['2', '3'] },
        { _id: '5', dependsOn: ['4', 'not_found'] } // 'not_found' should be ignored
    ];

    it('getPredecessors builds adjacency maps correctly', () => {
        const { byId, pred } = getPredecessors(sampleTasks);
        expect(byId.has('1')).toBe(true);
        expect(pred.get('2')).toEqual(['1']);
        expect(pred.get('4')).toEqual(['2', '3']);
        expect(pred.get('5')).toEqual(['4']); // Ignores missing task 'not_found'
    });

    it('getLayers computes topological depth correctly', () => {
        const { pred } = getPredecessors(sampleTasks);
        const layers = getLayers(sampleTasks, pred);

        expect(layers.get('1')).toBe(0);
        expect(layers.get('2')).toBe(1);
        expect(layers.get('3')).toBe(1);
        expect(layers.get('4')).toBe(2);
        expect(layers.get('5')).toBe(3);
    });

    it('getCriticalPath computes the longest path', () => {
        const { pred } = getPredecessors(sampleTasks);
        const { pathIds, pathEdges } = getCriticalPath(sampleTasks, pred);

        // Path should be 5 -> 4 -> 2 or 3 -> 1
        expect(pathIds.has('5')).toBe(true);
        expect(pathIds.has('4')).toBe(true);
        expect(pathIds.has('1')).toBe(true);
        
        // Either 2 or 3 should be on the path, both have same length
        expect(pathIds.has('2') || pathIds.has('3')).toBe(true);
    });

});
