declare module "stockfish" {
  const stockfish: () => {
    postMessage: (command: string) => void;
    onmessage: (message: string) => void;
    terminate: () => void;
  };

  export default stockfish;
}
