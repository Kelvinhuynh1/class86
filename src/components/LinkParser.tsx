import React from "react";
import { Link } from "react-router-dom";

interface LinkParserProps {
  text: string;
}

export default function LinkParser({ text }: LinkParserProps) {
  if (!text) return null;

  // Regular expression to match URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  // Split the text by URLs and create an array of text and link elements
  const parts = text.split(urlRegex);
  const matches = text.match(urlRegex) || [];

  return (
    <>
      {parts.map((part, i) => {
        // If this part is a URL, render it as a link
        if (matches.includes(part)) {
          const encodedUrl = encodeURIComponent(part);
          return (
            <Link
              key={i}
              to={`/link/${encodedUrl}`}
              className="text-blue-500 hover:underline"
            >
              {part}
            </Link>
          );
        }
        // Otherwise, render it as plain text
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}
