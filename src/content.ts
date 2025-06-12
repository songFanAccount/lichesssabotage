import { Chess } from "chess.js";
import { createRoot } from "react-dom/client";
import { ExtensionDisplay } from "./components/ExtensionDisplay";
import React from "react";
import { ExtensionSettings } from "./components/ExtensionSettings";

let side = 0;
let isMuted = false;
const userMoves: string[] = [];
let squareDim = 0;
let currentAudio: HTMLAudioElement | null = null;
let lastImgSrcIndex: number = 0;
const imgSrcs = ["blank", "sad", "angry", "goofy"];
const imgOffsets = [15, 15, 0, 0];
function playAudio(src: string) {
  if (isMuted) return;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  currentAudio = new Audio(chrome.runtime.getURL(src));
  currentAudio.volume = 0.2;
  currentAudio.play();
}
let currentShadowContainer: HTMLDivElement | null = null;

function spawnFadingImg(src: string, x: number, y: number) {
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

/* 
Stats:
1. User's number of moves
2. Number of best moves found -> Includes blocked
3. Number of best moves blocked
4. Number of best moves found before the engine 
5. Number of best moves allowed by timer
6. onlyMovesCount: Number of moves unblocked since they were the only move
*/

let bestMovesFound = new Set<number>(); // = (bestMovesBlocked) + (bestMovesMade) = (bestMovesBlocked) + (bestMovesBeforeEng + movesAllowedByTimer + onlyMovesCount)
let bestMovesBlocked = new Set<number>();
let bestMovesBeforeEng = new Set<number>();
let movesAllowedByTimer = new Set<number>();
let onlyMovesAllowed = new Set<number>();
function updateStats(data: any) {
  window.dispatchEvent(
    new CustomEvent("extension-stats-update", { detail: data })
  );
}
function updateStatus(data: any) {
  window.dispatchEvent(
    new CustomEvent("extension-status-update", {
      detail: data,
    })
  );
}
function incNumMoves() {
  updateStats({ numMoves: userMoves.length });
}
function incBestMovesBlocked() {
  const moveIndex = userMoves.length;
  const updateDetail: { [key: string]: any } = {};
  if (!bestMovesBlocked.has(moveIndex)) {
    bestMovesBlocked.add(moveIndex);
    updateDetail.bestMovesBlocked = bestMovesBlocked.size;
  }
  if (!bestMovesFound.has(moveIndex)) {
    bestMovesFound.add(moveIndex);
    updateDetail.bestMovesFound = bestMovesFound.size;
  }
  updateStats(updateDetail);
}
function incBestMoveBeforeEngCount(moveIndex: number) {
  const updateDetail: { [key: string]: any } = {};
  if (!bestMovesBeforeEng.has(moveIndex)) {
    bestMovesBeforeEng.add(moveIndex);
    updateDetail.bestMovesBeforeEng = bestMovesBeforeEng.size;
  }
  if (!bestMovesFound.has(moveIndex)) {
    bestMovesFound.add(moveIndex);
    updateDetail.bestMovesFound = bestMovesFound.size;
  }
  updateStats(updateDetail);
}
function incTimerAllowedCount() {
  const moveIndex = userMoves.length;
  const updateDetail: { [key: string]: any } = {};
  if (!movesAllowedByTimer.has(moveIndex)) {
    movesAllowedByTimer.add(moveIndex);
    updateDetail.movesAllowedByTimer = movesAllowedByTimer.size;
  }
  if (!bestMovesFound.has(moveIndex)) {
    bestMovesFound.add(moveIndex);
    updateDetail.bestMovesFound = bestMovesFound.size;
  }
  updateStats(updateDetail);
}
function incOnlyMoveCount() {
  const moveIndex = userMoves.length;
  const updateDetail: { [key: string]: any } = {};
  if (!onlyMovesAllowed.has(moveIndex)) {
    onlyMovesAllowed.add(moveIndex);
    updateDetail.onlyMovesAllowed = onlyMovesAllowed.size;
  }
  if (!bestMovesFound.has(moveIndex)) {
    bestMovesFound.add(moveIndex);
    updateDetail.bestMovesFound = bestMovesFound.size;
  }
  updateStats(updateDetail);
}
function incBookMoveCount() {
  const moveIndex = userMoves.length;
  if (!bestMovesFound.has(moveIndex)) {
    bestMovesFound.add(moveIndex);
    const numBookMoves = bestMovesFound.size;
    updateStats({
      numMoves: moveIndex + 1,
      bestMovesFound: numBookMoves,
      numBookMoves: numBookMoves,
    });
  }
}
function quitExtension() {
  console.log("Quitting extension...");
}
// Timer
let allowedToBlock = false;
let timerDuration = 3000;
let timerID: ReturnType<typeof setTimeout> | null = null;
function startOrRefreshTimer() {
  if (timerID !== null) {
    clearTimeout(timerID);
  }
  updateStatus({
    restartTimer: true,
  });
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
type Move = {
  uci: string;
  san: string;
  white: number;
  draws: number;
  black: number;
  averageRating: number;
};
type LichessExplorerResponse = {
  white: number;
  draws: number;
  black: number;
  moves: Move[];
};
async function getBookMoves(fen: string): Promise<Move[] | undefined> {
  const url = `https://explorer.lichess.ovh/masters?fen=${encodeURIComponent(
    fen
  )}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Lichess API error: ${response.status}`);
    }
    const data: LichessExplorerResponse = await response.json();
    return data.moves;
  } catch (error) {
    console.error("Error fetching book moves:", error);
    return undefined;
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
    const urlMatch = window.location.pathname.match(/\/([a-zA-Z0-9]+)(?:\/|$)/);
    if (!urlMatch) {
      quitExtension();
      return;
    }
    const rm6 = await waitForRM6();
    const chessjs = new Chess();
    async function updateUsermoveToUCI(moveIndex: number, fen: string) {
      const moveInSan = userMoves[moveIndex];
      const copyBoard = new Chess(fen);
      const moveObj = copyBoard.move(moveInSan);
      if (moveObj) {
        const uci = moveObj.from + moveObj.to + (moveObj.promotion || "");
        userMoves[moveIndex] = uci;
      }
    }
    function waitForDisplay(): Promise<Event> {
      return new Promise((resolve) => {
        const handler = (event: Event) => {
          window.removeEventListener("extension_display_ready", handler);
          resolve(event);
        };
        window.addEventListener("extension_display_ready", handler);
      });
    }
    function waitForSettings(): Promise<Event> {
      return new Promise((resolve) => {
        const handler = (event: Event) => {
          window.removeEventListener("extension_settings_ready", handler);
          resolve(event);
        };
        window.addEventListener("extension_settings_ready", handler);
      });
    }
    function applySettings(event: Event) {
      const customEvent = event as CustomEvent;
      const detail = customEvent.detail;
      if ("isMuted" in detail) isMuted = detail.isMuted;
      if ("duration" in detail) timerDuration = detail.duration * 1000;
      chrome.storage.local.set({
        sab_isMuted: isMuted,
        sab_timerDuration: timerDuration,
      });
      window.dispatchEvent(
        new CustomEvent("extension-settings-update", {
          detail: {
            appliedIsMuted: isMuted,
            appliedDuration: detail.duration,
          },
        })
      );
    }
    const gameMeta = document.querySelector("div.game__meta");
    if (gameMeta) {
      const container = document.createElement("div");
      container.id = "extension-display-root";
      gameMeta.parentNode?.insertBefore(container, gameMeta.nextSibling);
      const root = createRoot(container);
      const display = React.createElement(ExtensionDisplay);
      root.render(display);
      await waitForDisplay();
      const settingsContainer = document.createElement("div");
      settingsContainer.id = "extension-settings-root";
      settingsContainer.textContent = "settings";
      container.parentNode?.insertBefore(
        settingsContainer,
        container.nextSibling
      );
      const settingsRoot = createRoot(settingsContainer);
      const settingsDisplay = React.createElement(ExtensionSettings);
      settingsRoot.render(settingsDisplay);
      await waitForSettings();
      window.addEventListener("apply-settings", applySettings);
    }
    const movelistObserver = new MutationObserver((mutationsList) => {
      mutationsList.forEach((mutation) => {
        mutation.addedNodes.forEach(async (node) => {
          const nodeEl = node as HTMLElement;
          if (nodeEl.tagName === "KWDB") {
            const move = nodeEl.textContent?.trim();
            if (move) {
              const movingSide = chessjs.turn();
              const isUserTurn =
                (movingSide === "w" && side === 0) ||
                (movingSide === "b" && side === 1);
              const validMove = chessjs.move(move);
              if (!validMove) {
                console.error("Invalid move...");
              } else if (isUserTurn) {
                if (stillBookMoves) {
                  const bookMoves = await getBookMoves(chessjs.fen());
                  const isStillBook = bookMoves && bookMoves.length > 0;
                  if (isStillBook) {
                    bestMoves.push(move);
                    incBookMoveCount();
                    userMoves.push(move);
                  } else {
                    toggleOffBook();
                    bestMoves.push(undefined);
                    userMoves.push(move);
                    incNumMoves();
                  }
                } else {
                  userMoves.push(move);
                  incNumMoves();
                }
                updateStatus({
                  isUsersTurn: false,
                });
              } else {
                startOrRefreshTimer();
                await updateBestmove(chessjs.fen());
              }
            }
          }
        });
      });
    });
    let l4x = rm6.querySelector("l4x") as HTMLElement | undefined;
    if (l4x) {
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
        quitExtension();
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
    if (!cgWrap) {
      quitExtension();
      return;
    }
    side = cgWrap.classList.contains("orientation-white") ? 0 : 1;

    // ALL GOOD TO GO

    const bookmovesOnLoad = await getBookMoves(chessjs.fen());
    if (!bookmovesOnLoad) return;
    let stillBookMoves = bookmovesOnLoad.length > 0; // If the game is still in book, don't block any book moves, and don't use engine to calculate best moves.
    function toggleOffBook() {
      stillBookMoves = false;
      window.dispatchEvent(
        new CustomEvent("book-moves-change", {
          detail: {
            isBookMoves: stillBookMoves,
          },
        })
      );
    }
    window.dispatchEvent(
      new CustomEvent("book-moves-change", {
        detail: {
          isBookMoves: stillBookMoves,
        },
      })
    );
    chrome.storage.local.get(
      ["sab_isMuted", "sab_timerDuration"],
      (data: { [key: string]: any }) => {
        if ("sab_isMuted" in data) isMuted = data.sab_isMuted;
        if ("sab_timerDuration" in data) timerDuration = data.sab_timerDuration;
        window.dispatchEvent(
          new CustomEvent("extension-settings-load", {
            detail: {
              isMuted: isMuted,
              duration: timerDuration / 1000,
            },
          })
        );
      }
    );
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
      return ret;
    }
    function onBlock() {
      incBestMovesBlocked();
      playAudio("sounds/vine-boom.mp3");
      const boardRect = board.getBoundingClientRect();
      if (bestMoveEndX !== undefined && bestMoveEndY !== undefined) {
        spawnFadingImg(
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
        incOnlyMoveCount();
        return;
      }
      if (allowedToBlock) {
        if (!draggingPiece) onBlock();
        event.stopImmediatePropagation();
        event.preventDefault();
      } else {
        incTimerAllowedCount();
      }
    }
    function blockDragMove(event: MouseEvent) {
      if (onlyOneMove()) {
        incOnlyMoveCount();
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
          incTimerAllowedCount();
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
      updateStatus({
        isUsersTurn: true,
      });
      if (stillBookMoves) {
        const bookmoves = await getBookMoves(chessjs.fen());
        if (!bookmoves || bookmoves.length === 0) toggleOffBook();
        else {
          return;
        }
      }
      updateStatus({
        engineIsThinking: true,
      });
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
      updateStatus({
        engineIsThinking: false,
      });
      const bestMoveIndex = bestMoves.length;
      bestMoves.push(bestMoveInLan);
      if (bestMoveIndex < userMoves.length) {
        updateUsermoveToUCI(bestMoveIndex, fen);
        if (
          bestMoveInLan === userMoves[bestMoveIndex] &&
          !bestMovesBeforeEng.has(bestMoveIndex)
        ) {
          incBestMoveBeforeEngCount(bestMoveIndex);
        }
      }
    }
    const rm6observer = new MutationObserver((mutationsList) => {
      const resultWrap = rm6.querySelector("div.result-wrap");
      if (resultWrap) {
        const status = resultWrap.querySelector("p.status");
        if (status) {
          const statusText = status.textContent;
          if (statusText) {
            const winSide = statusText.includes("White is victorious")
              ? 0
              : statusText.includes("Black is victorious")
              ? 1
              : -1;
            const winLoss =
              winSide === -1 ? undefined : winSide === side ? true : false;
            const endDisplayText =
              winLoss !== undefined
                ? winLoss
                  ? "You won :("
                  : "You lost :)"
                : statusText.includes("Draw")
                ? "Draw :|"
                : statusText.includes("Game aborted")
                ? "Game aborted"
                : statusText.includes("Stalemate")
                ? "Stalemate.."
                : "Game ended: N/A";
            window.dispatchEvent(
              new CustomEvent("extension-status-update", {
                detail: {
                  gameEndStatus: endDisplayText,
                },
              })
            );
          }
        }
      }
      if (l4x) return; // Only purpose of this observer is to observe for l4x
      mutationsList.forEach((mutation) => {
        const addedNodes = mutation.addedNodes;
        addedNodes.forEach((node) => {
          const nodeEl = node as HTMLElement;
          if (nodeEl.tagName === "L4X") {
            l4x = nodeEl;
            movelistObserver.observe(l4x, { childList: true });
            l4x.childNodes.forEach(async (node) => {
              const nodeEl = node as HTMLElement;
              if (nodeEl.tagName === "KWDB") {
                const move = nodeEl.textContent?.trim();
                if (move) {
                  const movingSide = chessjs.turn();
                  const userMadeFirstMove =
                    (movingSide === "w" && side === 0) ||
                    (movingSide === "b" && side === 1);
                  const validMove = chessjs.move(move);
                  if (!validMove) {
                    console.error("Invalid move...");
                  } else if (userMadeFirstMove) {
                    if (stillBookMoves) {
                      const bookMoves = await getBookMoves(chessjs.fen());
                      const isStillBook = bookMoves && bookMoves.length > 0;
                      if (isStillBook) {
                        bestMoves.push(move);
                        incBookMoveCount();
                        userMoves.push(move);
                      } else {
                        toggleOffBook();
                        bestMoves.push(undefined);
                        userMoves.push(move);
                        incNumMoves();
                      }
                    } else {
                      userMoves.push(move);
                      incNumMoves();
                    }
                    updateStatus({
                      isUsersTurn: false,
                    });
                  } else {
                    startOrRefreshTimer();
                    await updateBestmove(chessjs.fen());
                  }
                }
              }
            });
          }
        });
      });
    });
    rm6observer.observe(rm6, {
      childList: true,
      subtree: true,
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
    const movingSide = chessjs.turn();
    const isUserTurn =
      (movingSide === "w" && side === 0) || (movingSide === "b" && side === 1);
    if (isUserTurn) {
      startOrRefreshTimer();
      await updateBestmove(chessjs.fen());
    }
    window.addEventListener("beforeunload", () => {
      window.removeEventListener("resize", updateSquareDim);
      window.removeEventListener("apply-settings", applySettings);
      board.removeEventListener("mouseup", blockDragMove, true);
      board.removeEventListener("mousedown", boardMouseDown, true);
    });
  }
})();
