import CircleIcon from "../static/icons/circle.svg";
import EraserIcon from "../static/icons/eraser.svg";
import PencilIcon from "../static/icons/pencil.svg";
import ImageIcon from "../static/icons/picture.svg";
import SlashIcon from "../static/icons/slash.svg";
import SquareIcon from "../static/icons/square.svg";
import TextIcon from "../static/icons/text.svg";
import TriangleIcon from "../static/icons/triangle.svg";
import { ToolsType } from "../types/tools";

export const tools: { name: ToolsType; icon: string }[] = [
  { name: "pencil", icon: PencilIcon },
  { name: "eraser", icon: EraserIcon },
  { name: "line", icon: SlashIcon },
  { name: "circle", icon: CircleIcon },
  { name: "triangle", icon: TriangleIcon },
  { name: "rectangle", icon: SquareIcon },
  { name: "text", icon: TextIcon },
  { name: "image", icon: ImageIcon },
];
