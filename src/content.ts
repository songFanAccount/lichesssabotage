import { Chess } from "chess.js";

let side = 0;
let squareDim = 0;
async function waitForBoard(): Promise<HTMLElement> {
  while (true) {
    const board = document.querySelector("cg-board") as HTMLElement | null;
    if (board) {
      return board; // Return the board when found
    }
    await new Promise((resolve) => setTimeout(resolve, 500)); // Wait 0.5 seconds
  }
}
async function waitForRM6(): Promise<HTMLElement> {
  while (true) {
    const rm6 = document.querySelector("rm6") as HTMLElement | null;
    if (rm6) {
      return rm6; // Return the board when found
    }
    await new Promise((resolve) => setTimeout(resolve, 500)); // Wait 0.5 seconds
  }
}

async function getBestMove(fen: string, depth: number = 15) {
  const url = `https://stockfish.online/api/s/v2.php?fen=${encodeURIComponent(
    fen
  )}&depth=${depth}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API error:", error);
    return null;
  }
}

function getXYCoordAtCoord(coord: string): [number, number] {
  const leftFile = side === 0 ? "a" : "h";
  const file = coord[0];
  const rank = parseInt(coord[1]);
  const x =
    side === 0
      ? file.charCodeAt(0) - leftFile.charCodeAt(0)
      : leftFile.charCodeAt(0) - file.charCodeAt(0);
  const y = side === 0 ? 8 - rank : rank - 1;
  return [x, y];
}
function blockMove(event: MouseEvent, square: HTMLElement) {
  return;
  event.preventDefault();
  event.stopPropagation();
  console.log("Blocking move..", square);
}

(async () => {
  if (window.location.hostname.includes("lichess.org")) {
    const urlMatch = window.location.pathname.match(
      /\/([a-zA-Z0-9]{8,12})(?:\/|$)/
    );
    if (!urlMatch) return;
    const rm6 = await waitForRM6();
    const chessjs = new Chess();
    const movelistObserver = new MutationObserver((mutationsList) => {
      mutationsList.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          const nodeEl = node as HTMLElement;
          if (nodeEl.tagName === "KWDB") {
            const move = nodeEl.textContent?.trim();
            if (move) {
              const validMove = chessjs.move(move);
              if (!validMove) {
                console.error("Invalid move...");
              }
            }
          }
        });
      });
    });
    let l4x = rm6.querySelector("l4x") as HTMLElement | undefined;
    if (!l4x) {
      console.log("No moves made yet...");
    } else {
      console.log("Loading previous moves");
      let validLoad = true;
      l4x.childNodes.forEach((node) => {
        const nodeEl = node as HTMLElement;
        if (nodeEl.tagName === "KWDB") {
          const move = nodeEl.textContent?.trim();
          if (move) {
            const validMove = chessjs.move(move);
            if (!validMove) {
              validLoad = false;
              return;
            }
          }
        }
      });
      if (!validLoad) {
        console.error("Error loading moves...");
        return;
      }
      movelistObserver.observe(l4x, { childList: true });
    }
    const board = await waitForBoard();
    squareDim = board.offsetHeight / 8;
    function updateSquareDim() {
      squareDim = board.offsetHeight / 8;
    }
    window.addEventListener("resize", updateSquareDim);
    window.addEventListener("beforeunload", () => {
      window.removeEventListener("resize", updateSquareDim);
    });
    const cgWrap = document.querySelector(".cg-wrap") as
      | HTMLElement
      | undefined;
    if (!cgWrap) return;
    side = cgWrap.classList.contains("orientation-white") ? 0 : 1;
    const yourTurnContainer = document.querySelector(
      "div.rclock.rclock-turn.rclock-bottom"
    ) as HTMLElement;
    if (!board || !yourTurnContainer) return;

    // ALL GOOD TO GO

    let bestMove = null;
    let bestMoveStartX: number | undefined = undefined;
    let bestMoveStartY: number | undefined = undefined;
    let bestMoveEndCoord: string | undefined = undefined;
    let selectedEl: HTMLElement | undefined = undefined;
    const moveDests = new Set<HTMLElement>();
    async function updateBestmove(fen: string) {
      const start = Date.now();
      console.log("Thinking...");
      bestMove = await getBestMove(fen);
      const bestMoveInLan = bestMove.bestmove.split(" ")[1];
      const bestMoveStartCoord = bestMoveInLan.slice(0, 2);
      bestMoveEndCoord = bestMoveInLan.slice(2, 4);
      if (!bestMoveStartCoord || !bestMoveEndCoord) {
        console.error("Error parsing best move..?");
        return;
      }
      const bestMoveStartXY = getXYCoordAtCoord(bestMoveStartCoord);
      bestMoveStartX = bestMoveStartXY[0];
      bestMoveStartY = bestMoveStartXY[1];
      const end = Date.now();
      console.log(bestMoveInLan);
      console.log(`Time taken: ${end - start}ms`);
    }
    // On load, if it is user's turn, update best move
    if (yourTurnContainer.childNodes.length > 0)
      await updateBestmove(chessjs.fen());
    const yourTurnObserver = new MutationObserver(async (mutationsList) => {
      if (!l4x) {
        l4x = rm6.querySelector("l4x") as HTMLElement | undefined;
        if (l4x) {
          movelistObserver.observe(l4x, { childList: true });
          l4x.childNodes.forEach((node) => {
            const nodeEl = node as HTMLElement;
            if (nodeEl.tagName === "KWDB") {
              const move = nodeEl.textContent?.trim();
              if (move) {
                const validMove = chessjs.move(move);
                if (!validMove) {
                  console.error("Invalid move...");
                }
              }
            }
          });
        }
      }
      if (mutationsList[0].addedNodes.length === 1) {
        // User's turn
        await updateBestmove(chessjs.fen());
      }
    });
    yourTurnObserver.observe(yourTurnContainer, { childList: true });
    const observer = new MutationObserver((mutationsList) => {
      mutationsList.forEach((mutation) => {
        const addedNodes = mutation.addedNodes;
        addedNodes.forEach((node) => {
          const nodeEl = node as HTMLElement;
          if (nodeEl.classList.contains("selected")) {
            selectedEl = nodeEl;
          }
          if (nodeEl.classList.contains("move-dest")) {
            moveDests.add(nodeEl);
            nodeEl.addEventListener("mousedown", (event) =>
              blockMove(event, nodeEl)
            );
          }
        });
        const removedNodes = mutation.removedNodes;
        removedNodes.forEach((node) => {
          const nodeEl = node as HTMLElement;
          if (nodeEl.classList.contains("move-dest")) {
            moveDests.delete(nodeEl);
            nodeEl.removeEventListener("mousedown", (event) =>
              blockMove(event, nodeEl)
            );
          }
          if (nodeEl.classList.contains("selected")) {
            selectedEl = undefined;
          }
        });
      });
      if (bestMoveStartX && bestMoveStartY && bestMoveEndCoord && selectedEl) {
        const selectedElXY = selectedEl.style.transform.match(
          /translate\(([^,]+), ([^)]+)\)/
        );
        if (!selectedElXY) return;
        const selectedXpx = parseInt(selectedElXY[1]);
        const selectedYpx = parseInt(selectedElXY[2]);
        if (
          selectedXpx !== bestMoveStartX * squareDim ||
          selectedYpx !== bestMoveStartY * squareDim
        )
          return; // If selected piece is not best piece, return
        // Selected piece is the best piece to move
        const xy = getXYCoordAtCoord(bestMoveEndCoord);
        const x = xy[0];
        const y = xy[1];
        moveDests.forEach((dest) => {
          const transformXY = dest.style.transform.match(
            /translate\(([^,]+), ([^)]+)\)/
          );
          if (transformXY) {
            const xPx = parseInt(transformXY[1]);
            const yPx = parseInt(transformXY[2]);
            const isBestSquare = x * squareDim === xPx && y * squareDim === yPx;
            dest.style.outline = isBestSquare ? "2px solid red" : "none";
          }
        });
      }
    });
    observer.observe(board, { childList: true });
  }
})();
