console.log("✅ Content script loaded!");

function waitForBoard() {
  const board = document.querySelector("cg-board");
  if (board) {
    console.log("✅ Found the chessboard!", board);
    (board as HTMLElement).style.border = "5px solid red";
  } else {
    console.log("⏳ Chessboard not found yet, trying again...");
    setTimeout(waitForBoard, 500); // Retry in 0.5 seconds
  }
}
// Detect if you're on Lichess (double-check)
if (window.location.hostname.includes("lichess.org")) {
  console.log("🎯 We’re on Lichess!");
  waitForBoard();
}
