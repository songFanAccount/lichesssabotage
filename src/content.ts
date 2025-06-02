async function waitForBoard(): Promise<HTMLElement> {
  while (true) {
    const board = document.querySelector("cg-board") as HTMLElement | null;
    if (board) {
      return board; // Return the board when found
    }
    await new Promise((resolve) => setTimeout(resolve, 500)); // Wait 0.5 seconds
  }
}

async function fetchGameMoves(): Promise<string | undefined> {
  const urlMatch = window.location.pathname.match(/\/([a-zA-Z0-9]{8})(?:\/|$)/);
  if (!urlMatch) {
    console.log("❌ Couldn’t find a game ID in the URL!");
    return undefined;
  }
  const gameId = urlMatch[1];
  console.log("🎯 Detected game ID:", gameId);
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

function blockMove(event: MouseEvent, square: HTMLElement) {
  return;
  event.preventDefault();
  event.stopPropagation();
  console.log("Blocking move..", square);
}

(async () => {
  if (window.location.hostname.includes("lichess.org")) {
    let moves = await fetchGameMoves();
    if (moves === undefined) return;
    const board = await waitForBoard();
    console.log(moves);
    let squareDim = board.offsetHeight / 8;
    console.log(squareDim);
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
    console.log("Init last moves:", lastMove);
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
          if (nodeEl.classList.contains("last-move")) {
            lastMove[firstLastMove ? 1 : 0] = nodeEl;
            if (!firstLastMove) console.log(lastMove);
            firstLastMove = !firstLastMove;
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
      console.log(selectedEl);
      moveDests.forEach((dest) => {
        dest.style.outline = "2px solid red";
      });
    });
    observer.observe(board, { childList: true });
  }
})();
