interface FaqItem {
  question: string;
  answer: string;
}

export function Faq({ items }: { items: readonly FaqItem[] }) {
  return (
    <div className="faq-list">
      {items.map((item) => (
        <details key={item.question}>
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
