import React from 'react';

interface DraggableItem {
  id: string;
  [key: string]: any;
}

interface DraggableListProps<T extends DraggableItem> {
  items: T[];
  onReorder: (newOrder: T[]) => void;
  renderItem: (item: T, index: number, dragHandleProps: any) => React.ReactNode;
}

interface DraggableListItemProps<T extends DraggableItem> {
  item: T;
  index: number;
  moveItem: (fromIndex: number, toIndex: number) => void;
  renderItem: (item: T, index: number, dragHandleProps: any) => React.ReactNode;
}

function DraggableListItem<T extends DraggableItem>({
  item,
  index,
  moveItem,
  renderItem,
}: DraggableListItemProps<T>) {
  
  return (
    <div>
      {renderItem(item, index, {})}
    </div>
  );
}

export function DraggableList<T extends DraggableItem>({
  items,
  onReorder,
  renderItem,
}: DraggableListProps<T>) {
  const moveItem = (fromIndex: number, toIndex: number) => {
    const newItems = [...items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    onReorder(newItems);
  };

  return (
    <div>
      {items.map((item, index) => (
        <DraggableListItem
          key={item.id}
          item={item}
          index={index}
          moveItem={moveItem}
          renderItem={renderItem}
        />
      ))}
    </div>
  );
}