// The one place the site gets the maze demo from.
// When the maze-bot package is tagged (PLAN.md W6), replace this line with:
//   export { mountMazeDemo } from 'maze-bot/web';
export { mountMazeDemo, type MazeDemoHandle, type MazeDemoOptions } from './maze-stub';

// Flip to false once the real, trained policy is wired in.
export const IS_PREVIEW = true;
