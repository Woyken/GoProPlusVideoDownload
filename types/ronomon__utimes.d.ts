declare module '@ronomon/utimes' {
    function utimes(path: string, btime?: number, mtime?: number, atime?: number, callback?: () => void): void;
}
