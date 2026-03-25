export type DraftCardProps = {
  title: string;
  subtitle: string;
  text: string | null;
  copyKey: string;
  tooltipDraft: string | null;
  onCopy: (text: string, key: string) => void;
};
