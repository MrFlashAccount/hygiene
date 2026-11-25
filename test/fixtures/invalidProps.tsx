import * as R from "react";
import { createElement as element, memo as remember } from "react";

type Props = { readonly title: string };

export function Card({ title }: Props): R.ReactElement {
  if (title !== "") {
    return <article>{title}</article>;
  }
  return <aside />;
}

export const Heading = ({ title }: Props = { title: "" }): R.ReactNode =>
  title !== "" && <h1>{title}</h1>;

export default function ({ title }: Props): R.ReactNode {
  return title !== "" ? (
    <>
      <h2>{title}</h2>
      <hr />
    </>
  ) : null;
}

export const Label = function ({ title }: Props): R.ReactElement {
  return element("label", null, title);
};

export const Cached = remember(({ title }: Props) => title);

export const Input = R.forwardRef<HTMLInputElement, Props>(({ title }, ref) => (
  <input aria-label={title} ref={ref} />
));

function renderText({ title }: Props) {
  return title;
}
export const Text = remember(renderText);

const Content = ({ title }: Props) => title;
export const greeting = <Content title="Hello" />;

export const Caption: R.FC<Props> = ({ title }) => (title === "" ? null : title);
