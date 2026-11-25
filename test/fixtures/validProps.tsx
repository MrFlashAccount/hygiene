import React, { memo as remember } from "react";

type Props = { readonly title: string };
type ListProps = { readonly items: readonly Props[] };

export function Card(props: Props): React.ReactElement {
  const { title } = props;
  return <article>{title}</article>;
}

export function TitleLength({ title }: Props): number {
  return title.length;
}

export const renderTitle = ({ title }: Props): React.ReactElement => <span>{title}</span>;

export function List(props: ListProps): React.ReactElement {
  return (
    <ul>
      {props.items.map(({ title }) => (
        <li key={title}>{title}</li>
      ))}
    </ul>
  );
}

// The only JSX return belongs to a callback, not to the PascalCase helper.
export function MakeRenderer({ title }: Props): () => React.ReactElement {
  return function render() {
    return <span>{title}</span>;
  };
}

export const CachedCard = remember(Card, ({ title }, next) => title === next.title);

type LocalWrap = (render: (input: Props) => string) => string;
type LocalApi = { readonly forwardRef: LocalWrap };

export function applyLocal(remember: LocalWrap, React: LocalApi): string {
  return remember(({ title }) => title) + React.forwardRef(({ title }) => title);
}

export const PlainCard = React.forwardRef((props: Props, ref: React.Ref<HTMLElement>) => (
  <article ref={ref}>{props.title}</article>
));
