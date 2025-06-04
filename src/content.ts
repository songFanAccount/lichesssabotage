import { Chess } from "chess.js";

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
              if (validMove) {
                console.log(chessjs.fen());
              } else {
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
      console.log("After load, FEN = " + chessjs.fen());
      movelistObserver.observe(l4x, { childList: true });
    }
    const board = await waitForBoard();
    const cgWrap = document.querySelector(".cg-wrap");
    if (!cgWrap) return;
    const yourTurnContainer = document.querySelector(
      "div.rclock.rclock-turn.rclock-bottom"
    ) as HTMLElement;
    if (!board || !yourTurnContainer) return;

    // ALL GOOD TO GO

    let selectedEl: HTMLElement | undefined = undefined;
    const moveDests = new Set<HTMLElement>();
    const yourTurnObserver = new MutationObserver((mutationsList) => {
      if (!l4x) {
        l4x = rm6.querySelector("l4x") as HTMLElement | undefined;
        if (l4x) {
          movelistObserver.observe(l4x, { childList: true });
          l4x.childNodes.forEach((node) => {
            const nodeEl = node as HTMLElement;
            if (nodeEl.tagName === "KWDB") {
              const move = nodeEl.textContent?.trim();
              if (move) {
                console.log(move);
                const validMove = chessjs.move(move);
                if (validMove) {
                  console.log(chessjs.fen());
                } else {
                  console.error("Invalid move...");
                }
              }
            }
          });
        }
      }
      if (mutationsList[0].addedNodes.length === 1) console.log("Your turn!");
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
      console.log(selectedEl);
      moveDests.forEach((dest) => {
        dest.style.outline = "2px solid red";
      });
    });
    observer.observe(board, { childList: true });
  }
})();
