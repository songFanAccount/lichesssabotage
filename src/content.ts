async function waitForBoard(): Promise<HTMLElement> {
  while (true) {
    const board = document.querySelector("cg-board") as HTMLElement | null;
    if (board) {
      return board; // Return the board when found
    }

    await new Promise((resolve) => setTimeout(resolve, 500)); // Wait 0.5 seconds
  }
}

function blockMove(event: MouseEvent, square: HTMLElement) {
  event.preventDefault();
  event.stopPropagation();
  console.log("Blocking move..", square);
}

(async () => {
  if (window.location.hostname.includes("lichess.org")) {
    const board = await waitForBoard();
    const cgWrap = document.querySelector(".cg-wrap") as HTMLElement | null;
    if (!cgWrap) {
      console.log("Couldn't find cgWrap...");
      return;
    }
    const side = cgWrap.classList.contains("orientation-white") ? 0 : 1;
    console.log(`User is playing as ${side === 0 ? "white" : "black"}.`);
    let squareDim = board.offsetHeight / 8;
    function updateSquareDim() {
      squareDim = board.offsetHeight / 8;
    }
    window.addEventListener("resize", updateSquareDim);
    window.addEventListener("beforeunload", () => {
      window.removeEventListener("resize", updateSquareDim);
    });
    // Observe all pieces
    board.childNodes.forEach((node) => {
      const nodeEl = node as HTMLElement;
      if (nodeEl.tagName === "PIECE") {
        const transformXY = nodeEl.style.transform.match(
          /translate\(([^,]+), ([^)]+)\)/
        );
        if (transformXY) {
          const xPx = parseInt(transformXY[1]);
          const yPx = parseInt(transformXY[2]);
          if (xPx % squareDim !== 0 || yPx % squareDim !== 0)
            console.log("Issues with square dim...");
          const x = xPx / squareDim;
          const y = yPx / squareDim;
          console.log(`(${x}, ${y})`, nodeEl);
        }
      }
    });
    let selectedEl: HTMLElement | undefined = undefined;
    const moveDests = new Set<HTMLElement>();
    const observer = new MutationObserver((mutationsList) => {
      mutationsList.forEach((mutation) => {
        const addedNodes = mutation.addedNodes;
        addedNodes.forEach((node) => {
          const nodeEl = node as HTMLElement;
          if (nodeEl.classList.contains("move-dest")) {
            moveDests.add(nodeEl);
            nodeEl.addEventListener("mousedown", (event) =>
              blockMove(event, nodeEl)
            );
          }
          if (nodeEl.classList.contains("selected")) {
            selectedEl = nodeEl;
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
