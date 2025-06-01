Observer mutations behaviour when 0. Clicking somewhere on board with no elements, or, clicking the opponent's pieces: Nothing

1. Nothing selected -> selecting a piece:
   Adds a square.selected
   For each available move of that piece, add a square.move-dest
2. A piece selected -> clicking the same piece:
   Removes the square.selected
   Remove all square.move-dest
3. A piece selected -> clicking another piece:
   square.selected changes but isnt notified
   If the number of available moves is the same, square.move-dest changes are not notified
   -> Assumption: Internal code simply updates the transform of move-dests
   If the number of available moves changes, square.move-dest are added/removed

POSSIBLY CAUSES ISSUES:

- Clicking another square isn't accurate recorded by this observer, further steps required to observe new move-dests.

4. A move was made:
   The square.selected element is removed
   All square.move-dest els are removed
