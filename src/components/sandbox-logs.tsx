'use client';

import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Terminal as TerminalIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { fetchSandboxBuildLogs } from '@/lib/role-api';
import type { SandboxBuildLog } from '@/lib/role-api';

interface SandboxLogsProps {
  slug: string;
  pollingInterval?: number;
  autoPoll?: boolean;
}

export function SandboxLogs({
  slug,
  pollingInterval = 2000,
  autoPoll = false,
}: SandboxLogsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    data: log,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<SandboxBuildLog>({
    queryKey: ['sandbox-logs', slug],
    queryFn: () => fetchSandboxBuildLogs(slug),
    enabled: !!slug,
    refetchInterval: autoPoll ? pollingInterval : false,
  });

  // Auto-scroll to bottom when new output arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [log?.output]);

  const getStatusBadge = (status?: string) => {
    switch (status) {
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
          {log && getStatusBadge(log.status)}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          loading={isFetching}
          title="Refresh logs"
        >
          <RefreshCw
            className={cn('h-4 w-4', isFetching && 'animate-spin')}
          />
        </Button>
      </div>

      {/* Terminal area */}
      <div
        ref={scrollRef}
        className="max-h-80 min-h-[160px] overflow-auto rounded-lg bg-black p-4 font-mono text-sm leading-relaxed text-green-400"
      >
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-gray-500" />
            Loading logs...
          </div>
        ) : log?.output ? (
          log.output.split('\n').map((line, i) => (
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
        {log?.status === 'building' && (
          <span className="inline-block h-4 w-2 animate-pulse bg-green-400" />
        )}
      </div>
    </div>
  );
}
