import type { Project } from "./api";
import type { Locale } from "./i18n";
export const projectNavigation = (locale: Locale) =>
  ({
    en: {
      explore: "Explore project",
      choose: "Choose a block",
      back: "Back to project",
      blocks: "All blocks",
    },
    ka: {
      explore: "პროექტის დათვალიერება",
      choose: "აირჩიეთ ბლოკი",
      back: "პროექტზე დაბრუნება",
      blocks: "ყველა ბლოკი",
    },
    ru: {
      explore: "Изучить проект",
      choose: "Выберите блок",
      back: "Назад к проекту",
      blocks: "Все блоки",
    },
    he: {
      explore: "גלו את הפרויקט",
      choose: "בחרו בניין",
      back: "חזרה לפרויקט",
      blocks: "כל הבניינים",
    },
  })[locale];
export function projectBlocks(project: Project) {
  const blocks =
    project.metadata?.blocks?.filter((block) =>
      block.buildingIds?.some((id) =>
        project.buildings.some((building) => building.id === id),
      ),
    ) || [];
  return blocks.length
    ? blocks
    : project.buildings.map((building) => ({
        id: building.id,
        name: building.name,
        polygon: [] as number[][],
        buildingIds: [building.id],
      }));
}
