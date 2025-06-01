console.log("✅ Content script loaded!");

async function waitForBoard(): Promise<HTMLElement> {
  while (true) {
    const board = document.querySelector("cg-board") as HTMLElement | null;
    if (board) {
      console.log("✅ Found the chessboard!", board);
      return board; // Return the board when found
    }

    console.log("⏳ Chessboard not found yet, waiting...");
    await new Promise((resolve) => setTimeout(resolve, 500)); // Wait 0.5 seconds
  }
}

(async () => {
  if (window.location.hostname.includes("lichess.org")) {
    console.log("🎯 We’re on Lichess!");
    const board = await waitForBoard();
    let selectedEl: HTMLElement | undefined = undefined;
    const moveDests = new Set<HTMLElement>();
    console.log("🏁 Done waiting, continuing with board:", board);
    const observer = new MutationObserver((mutationsList) => {
      console.log("🟢 Board mutations detected!");
      mutationsList.forEach((mutation) => {
        const addedNodes = mutation.addedNodes;
        addedNodes.forEach((node) => {
          const nodeEl = node as HTMLElement;
          if (nodeEl.classList.contains("move-dest")) {
            moveDests.add(nodeEl);
            console.log("Added move-dest");
          }
          if (nodeEl.classList.contains("selected")) {
            selectedEl = nodeEl;
            console.log("Piece selected");
          }
        });
        const removedNodes = mutation.removedNodes;
        removedNodes.forEach((node) => {
          const nodeEl = node as HTMLElement;
          if (nodeEl.classList.contains("move-dest")) {
            moveDests.delete(nodeEl);
            console.log("Removed move-dest");
          }
          if (nodeEl.classList.contains("selected")) {
            selectedEl = undefined;
            console.log("No piece selected");
          }
        });
      });
      console.log(moveDests);
      console.log(selectedEl);
      moveDests.forEach((dest) => {
        dest.style.outline = "2px solid red";
      });
    });
    observer.observe(board, { childList: true });
  }
})();
