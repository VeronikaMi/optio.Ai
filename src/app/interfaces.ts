export interface AGGREGATE {
  dimension: string;
  types: string[];
  gteDate: string;
  lteDate: string;
  includeMetrics: string[];
}

export interface FINDS {
  dimension: string;
  types: string[];
  gteDate: string;
  lteDate: string;
  sortBy: string;
  sortDirection: string;
  pageIndex: number;
  pageSize: number;
  includes: string[];
}

export interface FACTS {
  dimension: string;
  dimensionId: string;
  volume: number;
  quantity: number;
  average: number;
}

export interface FACTS_DETAILS extends FACTS {
  source: string;
  kind: string;
  date: string;
  type: number;
  differenceQuantity: number;
  differenceQuantityPersent: number;
  differenceVolume: number;
  differenceVolumePersent: number;
  differenceAverage: number;
  differenceAveragePersent: number;
}
