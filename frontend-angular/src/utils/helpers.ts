export const strStrip = (str: string, sub: string): string => {
    let result = str;
    while (result.startsWith(sub)) result = result.slice(sub.length);
    while (result.endsWith(sub)) result = result.slice(0, -sub.length);
    return result;
};

export const fileToUrl = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
};
