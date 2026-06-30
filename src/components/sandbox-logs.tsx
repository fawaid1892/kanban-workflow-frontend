'use client';

import React, { useEffect, useRef } from 'react';
import { Terminal as TerminalIcon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBuildProgress } from '@/hooks/use-build-progress';

interface SandboxLogsProps {
  slug: string;
}

export function SandboxLogs({ slug }: SandboxLogsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { log, status, clearLog } = useBuildProgress(slug);

  // Auto-scroll to bottom when new output arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [log]);

  const getStatusBadge = (currentStatus?: string) => {
    switch (currentStatus) {
      case 'building':
        return (
          <Badge variant="warning">
            <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
            Building
          </Badge>
        );
      case 'success':
        return <Badge variant="success">Success</Badge>;
      case 'failed':
        return <Badge variant="error">Failed</Badge>;
      default:
        return <Badge variant="default">No builds yet</Badge>;
    }
  };

  return (
    <div className="space-y-3">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Build Logs
          </span>
          {status && getStatusBadge(status)}
        </div>
        <div className="flex items-center gap-2">
          {log && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearLog}
              title="Clear logs"
            >
              Clear
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearLog()}
            title="Refresh logs"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Terminal area */}
      <div
        ref={scrollRef}
        className="max-h-80 min-h-[160px] overflow-auto rounded-lg bg-black p-4 font-mono text-sm leading-relaxed text-green-400"
      >
        {log ? (
          log.split('\n').map((line, i) => (
            <div key={i} className="whitespace-pre-wrap break-all">
              {line || '\u00A0'}
            </div>
          ))
        ) : (
          <div className="text-gray-500">
            No build logs available. Click &ldquo;Build Image&rdquo; to start a
            build.
          </div>
        )}

        {/* Animated cursor when building */}
        {status === 'building' && (
          <span className="inline-block h-4 w-2 animate-pulse bg-green-400" />
        )}
      </div>
    </div>
  );
}
