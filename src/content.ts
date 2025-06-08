import { Chess } from "chess.js";

let side = 0;
let squareDim = 0;
declare const chrome: any;
let currentAudio: HTMLAudioElement | null = null;
let lastImgSrcIndex: number = 0;
const imgSrcs = ["blank", "sad", "angry", "goofy"];
const imgOffsets = [15, 15, 0, 0];
function playAudio(src: string) {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  currentAudio = new Audio(chrome.runtime.getURL(src));
  currentAudio.volume = 0.3;
  currentAudio.play();
}
let currentShadowContainer: HTMLDivElement | null = null;

function spawnFallingImg(src: string, x: number, y: number) {
  // Remove the previous image (if any)
  if (currentShadowContainer) {
    currentShadowContainer.remove();
    currentShadowContainer = null;
  }

  const shadowContainer = document.createElement("div");
  shadowContainer.style.position = "fixed";
  shadowContainer.style.left = "0";
  shadowContainer.style.top = "0";
  shadowContainer.style.width = "100%";
  shadowContainer.style.height = "100%";
  shadowContainer.style.pointerEvents = "none";
  shadowContainer.style.zIndex = "9999";

  const shadow = shadowContainer.attachShadow({ mode: "open" });
  document.body.appendChild(shadowContainer);

  const img = document.createElement("img");
  img.src = chrome.runtime.getURL(src);
  img.style.position = "absolute";
  img.style.left = `${x}px`;
  img.style.top = `${y + imgOffsets[lastImgSrcIndex]}px`;
  img.style.width = `${squareDim}px`;
  img.style.transition = "opacity 2s linear";
  img.style.opacity = "1";

  shadow.appendChild(img);

  img.onload = () => {
    requestAnimationFrame(() => {
      img.style.opacity = "0";
    });
    setTimeout(() => {
      if (shadowContainer.parentNode) {
        shadowContainer.remove();
      }
      if (currentShadowContainer === shadowContainer) {
        currentShadowContainer = null;
      }
    }, 2000);
  };

  currentShadowContainer = shadowContainer;
}

// Timer
let allowedToBlock = false;
const timerDuration = 3000;
let timerID: ReturnType<typeof setTimeout> | null = null;
function startOrRefreshTimer() {
  if (timerID !== null) {
    clearTimeout(timerID);
  }
  allowedToBlock = false;
  timerID = setTimeout(() => {
    allowedToBlock = true;
  }, timerDuration);
}
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
(async () => {
  if (window.location.hostname.includes("lichess.org")) {
    const urlMatch = window.location.pathname.match(
      /\/([a-zA-Z0-9]{8,12})(?:\/|$)/
    );
    if (!urlMatch) return;
    const rm6 = await waitForRM6();
    const chessjs = new Chess();
    const userMoves: string[] = [];
    async function updateUsermoveToUCI(moveIndex: number, fen: string) {
      const moveInSan = userMoves[moveIndex];
      const copyBoard = new Chess(fen);
      const moveObj = copyBoard.move(moveInSan);
      if (moveObj) {
        const uci = moveObj.from + moveObj.to + (moveObj.promotion || "");
        userMoves[moveIndex] = uci;
        // console.log(`Updated user move ${moveIndex} to ${uci}`, userMoves);
      }
    }
    const movelistObserver = new MutationObserver((mutationsList) => {
      mutationsList.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          const nodeEl = node as HTMLElement;
          if (nodeEl.tagName === "KWDB") {
            const move = nodeEl.textContent?.trim();
            const copyBoardFen = chessjs.fen();
            if (move) {
              const movingSide = chessjs.turn();
              const isUserTurn =
                (movingSide === "w" && side === 0) ||
                (movingSide === "b" && side === 1);
              const validMove = chessjs.move(move);
              if (!validMove) {
                console.error("Invalid move...");
              } else if (isUserTurn) {
                userMoves.push(move);
                updateUsermoveToUCI(userMoves.length - 1, copyBoardFen);
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

    startOrRefreshTimer();
    let draggingPiece: HTMLElement | undefined = undefined;
    const pieceObserver = new MutationObserver((mutationsList) => {
      mutationsList.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          const target = mutation.target as HTMLElement;
          if (target.classList.contains("dragging")) {
            draggingPiece = target;
          } else {
            if (draggingPiece && draggingPiece === target) {
              draggingPiece = undefined;
            }
          }
        }
      });
    });
    board.querySelectorAll("piece").forEach((piece) => {
      const pieceEl = piece as HTMLElement;
      pieceObserver.observe(pieceEl, {
        attributes: true,
        attributeFilter: ["class"],
      });
    });
    let bestMove = null;
    let bestMoveStartX: number | undefined = undefined;
    let bestMoveStartY: number | undefined = undefined;
    let bestMoveEndX: number | undefined = undefined;
    let bestMoveEndY: number | undefined = undefined;
    const bestMoves: (string | undefined)[] = [];
    function clearBestMove() {
      bestMove = null;
      bestMoveStartX = undefined;
      bestMoveStartY = undefined;
      bestMoveEndX = undefined;
      bestMoveEndY = undefined;
    }
    let selectedEl: HTMLElement | undefined = undefined;
    const moveDests = new Set<HTMLElement>();
    let hoveredMoveDest: HTMLElement | undefined = undefined;
    function boardMouseDown() {
      if (!draggingPiece) {
        hoveredMoveDest = undefined;
      }
    }
    function manualClickDestFunc(event: MouseEvent) {
      if (draggingPiece) {
        const mouseupEvent = new MouseEvent("mouseup", {
          bubbles: true,
          cancelable: true,
          clientX: event.clientX,
          clientY: event.clientY,
        });
        board.dispatchEvent(mouseupEvent);
      }
    }
    function onlyOneMove() {
      const ret = chessjs.moves().length <= 1;
      if (ret) {
        console.log("Let you through because it's the only move...");
      }
      return ret;
    }
    function onBlock() {
      playAudio("sounds/vine-boom.mp3");
      const boardRect = board.getBoundingClientRect();
      if (bestMoveEndX !== undefined && bestMoveEndY !== undefined) {
        spawnFallingImg(
          `images/${imgSrcs[lastImgSrcIndex]}.png`,
          boardRect.left + bestMoveEndX * squareDim,
          boardRect.top + bestMoveEndY * squareDim
        );
        const random3 = Math.floor(Math.random() * 3) + 1;
        lastImgSrcIndex += random3;
        if (lastImgSrcIndex > 3) lastImgSrcIndex -= 4;
      }
    }
    function blockMove(event: MouseEvent) {
      if (onlyOneMove()) {
        return;
      }
      if (allowedToBlock) {
        onBlock();
        event.stopImmediatePropagation();
        event.preventDefault();
      } else {
        console.log("Saved by timer...");
      }
    }
    function blockDragMove(event: MouseEvent) {
      if (onlyOneMove()) {
        return;
      }
      if (
        selectedEl &&
        draggingPiece &&
        hoveredMoveDest &&
        bestMoveStartX !== undefined &&
        bestMoveStartY !== undefined &&
        bestMoveEndX !== undefined &&
        bestMoveEndY !== undefined
      ) {
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
        const hoveredMoveDestXY = hoveredMoveDest.style.transform.match(
          /translate\(([^,]+), ([^)]+)\)/
        );
        if (!hoveredMoveDestXY) return;
        const hoveredXpx = parseInt(hoveredMoveDestXY[1]);
        const hoveredYpx = parseInt(hoveredMoveDestXY[2]);
        if (
          hoveredXpx / squareDim !== bestMoveEndX ||
          hoveredYpx / squareDim !== bestMoveEndY
        ) {
          return; // If this move is not best move, return, don't block
        }
        if (allowedToBlock) {
          onBlock();
          event.stopImmediatePropagation();
          event.preventDefault();
        } else {
          console.log("Saved by timer...");
        }
      }
    }
    board.addEventListener("mousedown", boardMouseDown, true);
    board.addEventListener("mouseup", blockDragMove, true);
    function updateMoveDestsForBlocking() {
      if (!selectedEl) {
        return;
      }
      const selectedElXY = selectedEl.style.transform.match(
        /translate\(([^,]+), ([^)]+)\)/
      );
      if (!selectedElXY) return;
      const selectedXpx = parseInt(selectedElXY[1]);
      const selectedYpx = parseInt(selectedElXY[2]);
      const evaluated =
        bestMoveStartX !== undefined &&
        bestMoveStartY !== undefined &&
        bestMoveEndX !== undefined &&
        bestMoveEndY !== undefined;
      let unblockAll = !evaluated;
      if (
        !unblockAll &&
        bestMoveStartX !== undefined &&
        bestMoveStartY !== undefined
      ) {
        if (
          selectedXpx !== bestMoveStartX * squareDim ||
          selectedYpx !== bestMoveStartY * squareDim
        ) {
          unblockAll = true;
        }
      }
      moveDests.forEach((dest) => {
        if (unblockAll) {
          dest.removeEventListener("mousedown", blockMove);
          dest.removeEventListener("mousedown", manualClickDestFunc);
          return;
        }
        // If the position has been evaluated, and the selected piece is the best piece to move
        const transformXY = dest.style.transform.match(
          /translate\(([^,]+), ([^)]+)\)/
        );
        if (
          !transformXY ||
          bestMoveEndX === undefined ||
          bestMoveEndY === undefined
        )
          return;
        const xPx = parseInt(transformXY[1]);
        const yPx = parseInt(transformXY[2]);
        const isBestSquare =
          bestMoveEndX * squareDim === xPx && bestMoveEndY * squareDim === yPx;
        if (isBestSquare) {
          dest.addEventListener("mousedown", blockMove);
          dest.removeEventListener("mousedown", manualClickDestFunc);
        } else {
          dest.removeEventListener("mousedown", blockMove);
          dest.addEventListener("mousedown", manualClickDestFunc);
        }
      });
    }
    async function updateBestmove(fen: string) {
      const start = Date.now();
      console.log("Thinking...");
      clearBestMove();
      bestMove = await getBestMove(fen);
      if (!bestMove.bestmove) return;
      const bestMoveInLan = bestMove.bestmove.split(" ")[1];
      const bestMoveStartCoord = bestMoveInLan.slice(0, 2);
      const bestMoveEndCoord = bestMoveInLan.slice(2, 4);
      if (!bestMoveStartCoord || !bestMoveEndCoord) {
        console.error("Error parsing best move..?");
        return;
      }
      const bestMoveStartXY = getXYCoordAtCoord(bestMoveStartCoord);
      bestMoveStartX = bestMoveStartXY[0];
      bestMoveStartY = bestMoveStartXY[1];
      const bestMoveEndXY = getXYCoordAtCoord(bestMoveEndCoord);
      bestMoveEndX = bestMoveEndXY[0];
      bestMoveEndY = bestMoveEndXY[1];
      updateMoveDestsForBlocking();
      const bestMoveIndex = bestMoves.length;
      bestMoves.push(bestMoveInLan);
      const end = Date.now();
      console.log(`Time taken: ${end - start}ms`);
      if (bestMoveIndex < userMoves.length) {
        console.log(
          `Move ${bestMoveIndex}: Engine (${bestMoveInLan}), You (${userMoves[bestMoveIndex]})`
        );
        if (bestMoveInLan === userMoves[bestMoveIndex]) {
          console.log("You beat the engine to this move!");
        }
      }
    }
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
        startOrRefreshTimer();
        await updateBestmove(chessjs.fen());
      }
    });
    function onDestHover(event: MouseEvent) {
      hoveredMoveDest = event.target as HTMLElement;
    }
    function onDestUnhover(event: MouseEvent) {
      if (
        hoveredMoveDest &&
        hoveredMoveDest === (event.target as HTMLElement)
      ) {
        hoveredMoveDest = undefined;
      }
    }
    yourTurnObserver.observe(yourTurnContainer, { childList: true });
    const boardObserver = new MutationObserver((mutationsList) => {
      mutationsList.forEach((mutation) => {
        if (mutation.type === "childList") {
          const addedNodes = mutation.addedNodes;
          addedNodes.forEach((node) => {
            const nodeEl = node as HTMLElement;
            if (nodeEl.classList.contains("selected")) {
              // A PIECE WAS SELECTED
              selectedEl = nodeEl;
            }
            if (nodeEl.classList.contains("move-dest")) {
              // A MOVE-DEST SQUARE WAS ADDED
              moveDests.add(nodeEl);
              nodeEl.addEventListener("mouseenter", onDestHover);
              nodeEl.addEventListener("mouseleave", onDestUnhover);
            }
            if (nodeEl.tagName === "PIECE") {
              pieceObserver.observe(nodeEl, {
                attributes: true,
                attributeFilter: ["class"],
              });
            }
          });
          const removedNodes = mutation.removedNodes;
          removedNodes.forEach((node) => {
            const nodeEl = node as HTMLElement;
            if (nodeEl.classList.contains("move-dest")) {
              //  A MOVE-DEST WAS REMOVED
              moveDests.delete(nodeEl);
              nodeEl.removeEventListener("mousedown", blockMove);
              nodeEl.removeEventListener("mousedown", manualClickDestFunc);
              nodeEl.removeEventListener("mouseenter", onDestHover);
              nodeEl.removeEventListener("mouseleave", onDestUnhover);
            }
            if (nodeEl.classList.contains("selected")) {
              // SELECTED PIECE -> UNSELECT
              selectedEl = undefined;
            }
          });
        }
      });
      updateMoveDestsForBlocking();
    });
    boardObserver.observe(board, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true,
    });
    // On load, if it is user's turn, update best move
    if (yourTurnContainer.childNodes.length > 0)
      await updateBestmove(chessjs.fen());
    window.addEventListener("beforeunload", () => {
      window.removeEventListener("resize", updateSquareDim);
      board.removeEventListener("mouseup", blockDragMove, true);
      board.removeEventListener("mousedown", boardMouseDown, true);
    });
  }
})();
