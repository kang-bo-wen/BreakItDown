// types/graph.ts

/**
 * 四种内容维度
 * mechanical: 纯机械结构（齿轮、轴承、壳体）
 * electronic: 电子元件（芯片、传感器、PCB）
 * chemical:   化学配方（材料成分、涂层、电解质）
 * process:    加工工艺（冲压、焊接、热处理）
 */
export type ContentDimension = 'mechanical' | 'electronic' | 'chemical' | 'process';

export interface MechanicalMeta {
  material?: string;    // 材质，如 "304不锈钢"
  tolerance?: string;   // 公差，如 "±0.01mm"
  weight?: number;      // 克
}

export interface ElectronicMeta {
  partNumber?: string;  // 型号，如 "STM32F103"
  voltage?: string;     // 工作电压
  manufacturer?: string;
}

export interface ChemicalMeta {
  formula?: string;     // 化学式，如 "LiCoO2"
  purity?: string;      // 纯度，如 "99.9%"
  casNumber?: string;   // CAS号
}

export interface ProcessMeta {
  processType?: string; // 工艺类型，如 "CNC铣削"
  temperature?: string;
  duration?: string;    // 工时
  equipment?: string;   // 所需设备
}

/**
 * Represents a node in the visual graph.
 */
export interface MatterNode {
  id: string;           // UUID
  label: string;        // e.g., "Screen", "Glass", "Sand"
  type: 'root' | 'component' | 'raw_material';
  parentId: string | null;
  description?: string; // Short scientific/humorous description

  // 内容维度标记（可选，向后兼容）
  dimension?: ContentDimension;
  dimensionMeta?: MechanicalMeta | ElectronicMeta | ChemicalMeta | ProcessMeta;

  // State flags
  isExpanded: boolean;  // Has the user clicked this yet?
  isTerminal: boolean;  // Is this a natural resource? (Stops recursion)

  // Visual meta
  icon?: string;        // Optional emoji or icon name
  imageUrl?: string;    // Optional Wikimedia Commons image URL
  searchTerm?: string;  // Search term used to find the image
}

/**
 * The structure expected from the Gemini API.
 */
export interface DeconstructionResponse {
  parent_item: string;
  parts: {
    name: string;
    description: string;
    is_raw_material: boolean; // TRUE if it exists in nature (e.g. Iron Ore, Water)
    icon: string;             // Emoji icon representing this part
    searchTerm?: string;      // English search term for Wikimedia Commons
    percentage?: number;      // Estimated composition percentage
  }[];
}

/**
 * The structure for initial image identification.
 */
export interface IdentificationResponse {
  name: string;
  category: string;
  brief_description: string;
  icon: string; // Emoji icon representing the identified object
  searchTerm?: string; // English search term for Wikimedia Commons
}
