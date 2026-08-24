export type PaginatedResult<Item> = {
  items: Item[];
  total: number;
  limit: number;
  offset: number;
};
