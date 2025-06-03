let squareDim = 10;
let side = 0;
let promotionPiece = "";
async function waitForBoard(): Promise<HTMLElement> {
  while (true) {
    const board = document.querySelector("cg-board") as HTMLElement | null;
    if (board) {
      return board; // Return the board when found
    }
    await new Promise((resolve) => setTimeout(resolve, 500)); // Wait 0.5 seconds
  }
}

async function fetchGameMoves(gameId: string): Promise<string | undefined> {
  const apiUrl = `https://lichess.org/game/export/${gameId}`;
  try {
    const response = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      console.log("❌ Lichess API request failed:", response.status);
      return undefined;
    }
    const data = await response.json();
    return data.moves;
  } catch (error) {
    console.log("❌ Error fetching moves:", error);
    return undefined;
  }
}

function getChessCoord(x: number, y: number): string {
  // x determines file, y determines rank
  const leftFile = side === 0 ? "a" : "h";
  const xFile = String.fromCharCode(
    leftFile.charCodeAt(0) + (side === 0 ? 1 : -1) * x
  );
  const yRank = side === 0 ? 8 - y : 1 + y;
  return `${xFile}${yRank}`;
}
function lastMoveInUCI(
  init: HTMLElement | undefined,
  dest: HTMLElement | undefined
): string | undefined {
  if (!init || !dest) {
    console.error("Expected non-null last move");
    return undefined;
  }
  const initTransformXY = init.style.transform.match(
    /translate\(([^,]+), ([^)]+)\)/
  );
  const destTransformXY = dest.style.transform.match(
    /translate\(([^,]+), ([^)]+)\)/
  );
  if (!initTransformXY || !destTransformXY) {
    console.error("Invalid transforms..?");
    return undefined;
  }
  const initxPx = parseInt(initTransformXY[1]);
  const inityPx = parseInt(initTransformXY[2]);
  const initx = initxPx / squareDim;
  const inity = inityPx / squareDim;
  const initCoord = getChessCoord(initx, inity);
  const destxPx = parseInt(destTransformXY[1]);
  const destyPx = parseInt(destTransformXY[2]);
  const destx = destxPx / squareDim;
  const desty = destyPx / squareDim;
  const destCoord = getChessCoord(destx, desty);
  const uciStr = `${initCoord}${destCoord}${promotionPiece}`;
  if (promotionPiece !== "") promotionPiece = "";
  return uciStr;
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
    let gameId = urlMatch[1].slice(0, 8);
    let moves = await fetchGameMoves(gameId);
    const board = await waitForBoard();
    const cgWrap = document.querySelector(".cg-wrap");
    if (!cgWrap) return;
    side = cgWrap.classList.contains("orientation-white") ? 0 : 1; // 0 for white, 1 for black
    const yourTurnContainer = document.querySelector(
      "div.rclock.rclock-turn.rclock-bottom"
    ) as HTMLElement;
    if (!board || !yourTurnContainer) return;
    console.log(moves);
    squareDim = board.offsetHeight / 8;
    function updateSquareDim() {
      squareDim = board.offsetHeight / 8;
    }
    window.addEventListener("resize", updateSquareDim);
    window.addEventListener("beforeunload", () => {
      window.removeEventListener("resize", updateSquareDim);
    });
    // Observe all pieces
    // board.childNodes.forEach((node) => {
    //   const nodeEl = node as HTMLElement;
    //   if (nodeEl.tagName === "PIECE") {
    //     const transformXY = nodeEl.style.transform.match(
    //       /translate\(([^,]+), ([^)]+)\)/
    //     );
    //     if (transformXY) {
    //       const xPx = parseInt(transformXY[1]);
    //       const yPx = parseInt(transformXY[2]);
    //       if (xPx % squareDim !== 0 || yPx % squareDim !== 0)
    //         console.log("Issues with square dim...");
    //       const x = xPx / squareDim;
    //       const y = yPx / squareDim;
    //       console.log(`(${x}, ${y})`, nodeEl);
    //     }
    //   }
    // });
    let selectedEl: HTMLElement | undefined = undefined;
    const moveDests = new Set<HTMLElement>();
    let firstLastMove = true;
    const lastMoves = board.querySelectorAll("square.last-move");
    // Stores in format [init, dest]
    const lastMove: [HTMLElement | undefined, HTMLElement | undefined] =
      lastMoves.length === 0
        ? [undefined, undefined]
        : [lastMoves[1] as HTMLElement, lastMoves[0] as HTMLElement];
    const yourTurnObserver = new MutationObserver((mutationsList) => {
      const mutation = mutationsList[0];
      const lastMoves = board.querySelectorAll("square.last-move");
      lastMoves.forEach((lmove) => {
        const lmoveEl = lmove as HTMLElement;
        lastMove[firstLastMove ? 1 : 0] = lmoveEl;
        firstLastMove = !firstLastMove;
      });
      const lastMoveStr = lastMoveInUCI(lastMove[0], lastMove[1]);
      console.log(
        (mutation.addedNodes.length === 1 ? "Your turn!" : "Opponent's turn!") +
          " " +
          lastMoveStr
      );
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
          if (nodeEl.tagName === "PIECE") {
            // Should be a promotion piece
            const classList = nodeEl.classList;
            promotionPiece = "";
            if (classList.contains("queen")) promotionPiece = "q";
            else if (classList.contains("rook")) promotionPiece = "r";
            else if (classList.contains("knight")) promotionPiece = "k";
            else if (classList.contains("bishop")) promotionPiece = "b";
            console.log("Promoting -> " + promotionPiece);
          } else promotionPiece = "";
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
      console.log(selectedEl);
      moveDests.forEach((dest) => {
        dest.style.outline = "2px solid red";
      });
    });
    observer.observe(board, { childList: true });
  }
})();
