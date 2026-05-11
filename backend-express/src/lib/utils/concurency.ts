export async function processBatchByChunks<T, K>(
    batch: T[],
    transform: (item: T) => Promise<K>,
    chunkSize: number
): Promise<K[]> {
    const results: K[] = [];

    for (let i = 0; i < batch.length; i += chunkSize) {
        const chunk = batch.slice(i, i + chunkSize);
        const processed = await Promise.all(chunk.map(transform));
        results.push(...processed);
    }

    return results;
}

export async function processBatchWithSemaphore<T, K>(
    batch: T[],
    transform: (item: T) => Promise<K>,
    maxWorkers: number
): Promise<K[]> {
    const queue = batch.map((item, i) => ({ item, i }));
    const results: K[] = new Array(batch.length);

    async function worker() {
        while (queue.length) {
            const { item, i } = queue.shift()!;
            results[i] = await transform(item);
        }
    }

    await Promise.all(Array.from({ length: maxWorkers }, worker));
    return results;
}
