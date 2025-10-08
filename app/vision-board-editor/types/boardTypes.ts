// app/vision-board-editor/types/boardTypes.ts
export type BoardElementType = 'image' | 'text' | 'emoji' | 'sticker';

export interface BaseBoardElement {
  id: string;
  cocreation_id: string;
  type: BoardElementType;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  rotation: number;
  zindex: number;
  created_at: string;
}

export interface ImageElement extends BaseBoardElement {
  type: 'image';
  uri: string;
}

export interface TextElement extends BaseBoardElement {
  type: 'text';
  content: string;
  fontSize: number;
  color: string;
}

export interface EmojiElement extends BaseBoardElement {
  type: 'emoji';
  char: string;
  fontSize: number;
}

export interface StickerElement extends BaseBoardElement {
  type: 'sticker';
  uri: string;
}

export type BoardElement = 
  | ImageElement 
  | TextElement 
  | EmojiElement 
  | StickerElement;
