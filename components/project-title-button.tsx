"use client";

import React from 'react';

export interface ProjectAndVersionProps {
  name?: string;
  logo?: string;
  version?: string;
  className?: string;
}

export function ProjectAndVersion({ name, logo, version, className }: ProjectAndVersionProps) {
  return (
    <div className={`flex items-center gap-3 px-2 py-1 ${className ?? ''}`}>
      {logo ? (
        <img src={logo} alt={(name ? `${name} ` : '') + 'logo'} className="h-8 w-8 rounded object-contain" />
      ) : null}
      <div className="min-w-0 leading-tight">
        <div className="font-medium text-sm truncate" title={name}>{name ?? 'Project'}</div>
        {version ? (
          <div className="text-xs text-muted-foreground truncate" title={version}>{version}</div>
        ) : null}
      </div>
    </div>
  );
}


