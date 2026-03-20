"use client";

import { Component, ReactNode } from "react";
import { useTranslations } from 'next-intl';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations();
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <h2 className="text-xl font-light text-black mb-4">
        {t("errorBoundary.title")}
      </h2>
      <p className="text-sm text-neutral-400 mb-6">
        {t("errorBoundary.description")}
      </p>
      <button
        onClick={onRetry}
        className="px-6 py-2.5 bg-black text-white text-xs font-medium tracking-widest uppercase hover:bg-neutral-800 transition-colors"
      >
        {t("errorBoundary.retry")}
      </button>
    </div>
  );
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <ErrorFallback onRetry={() => this.setState({ hasError: false })} />
        )
      );
    }

    return this.props.children;
  }
}
