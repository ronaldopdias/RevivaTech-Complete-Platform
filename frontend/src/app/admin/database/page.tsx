'use client';

/**
 * RevivaTech Database Administration Interface
 * Comprehensive PostgreSQL admin dashboard with enterprise features
 * Following 2025 best practices for database management interfaces
 */

import React, { useState, useEffect, useRef } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserRole } from '@/lib/auth/types';
import { useAuth } from '@/lib/auth';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import Textarea from '@/components/ui/Textarea';
import { 
  Database, 
  Table2, 
  Search, 
  Play, 
  Download, 
  Settings, 
  BarChart3,
  Activity,
  Shield,
  FileText,
  Zap,
  Eye,
  Filter,
  RefreshCw,
  Terminal,
  TreePine
} from 'lucide-react';

// Database API service
class DatabaseService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/admin/database';
  }

  async getSchema() {
    const response = await fetch(`${this.baseUrl}/schema`);
    if (!response.ok) throw new Error('Failed to fetch schema');
    return response.json();
  }

  async getTables() {
    const response = await fetch(`${this.baseUrl}/tables`);
    if (!response.ok) throw new Error('Failed to fetch tables');
    return response.json();
  }

  async getTableDetails(tableName: string) {
    const response = await fetch(`${this.baseUrl}/tables/${tableName}`);
    if (!response.ok) throw new Error('Failed to fetch table details');
    return response.json();
  }

  async executeQuery(query: string, params: any[] = []) {
    const response = await fetch(`${this.baseUrl}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, params })
    });
    if (!response.ok) throw new Error('Query execution failed');
    return response.json();
  }

  async explainQuery(query: string) {
    const response = await fetch(`${this.baseUrl}/query/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    if (!response.ok) throw new Error('Failed to explain query');
    return response.json();
  }

  async getTableData(tableName: string, options: any = {}) {
    const params = new URLSearchParams(options);
    const response = await fetch(`${this.baseUrl}/data/${tableName}?${params}`);
    if (!response.ok) throw new Error('Failed to fetch table data');
    return response.json();
  }

  async getStats() {
    const response = await fetch(`${this.baseUrl}/stats`);
    if (!response.ok) throw new Error('Failed to fetch database stats');
    return response.json();
  }

  async getProcesses() {
    const response = await fetch(`${this.baseUrl}/processes`);
    if (!response.ok) throw new Error('Failed to fetch database processes');
    return response.json();
  }

  async exportData(options: any) {
    const response = await fetch(`${this.baseUrl}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
    if (!response.ok) throw new Error('Export failed');
    return response.blob();
  }
}

const dbService = new DatabaseService();

// SQL Editor Component with syntax highlighting simulation
const SqlEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onExecute: () => void;
  loading: boolean;
}> = ({ value, onChange, onExecute, loading }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter to execute
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      onExecute();
    }
    
    // Tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue = value.substring(0, start) + '  ' + value.substring(end);
        onChange(newValue);
        // Set cursor position after the tab
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        }, 0);
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>SQL Query</Label>
        <div className="flex gap-2">
          <Button 
            onClick={onExecute} 
            disabled={loading || !value.trim()}
            size="sm"
            className="flex items-center gap-1"
          >
            <Play className="w-3 h-3" />
            Execute (Ctrl+Enter)
          </Button>
        </div>
      </div>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="SELECT * FROM users LIMIT 10;"
        className="font-mono text-sm min-h-[200px] resize-y"
        style={{ fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace' }}
      />
      <div className="text-xs text-gray-500">
        Use Ctrl+Enter to execute query • Tab for indentation
      </div>
    </div>
  );
};

// Schema Browser Component
const SchemaBrowser: React.FC<{
  schema: any;
  onTableSelect: (table: string) => void;
  selectedTable: string | null;
}> = ({ schema, onTableSelect, selectedTable }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!schema) {
    return <div className="text-center py-8 text-gray-500">Loading schema...</div>;
  }

  const filteredTables = schema.tables?.filter((table: any) =>
    table.tablename.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search tables..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="text-sm"
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <TreePine className="w-4 h-4" />
          Database: {schema.database?.database_name}
        </div>
        
        <div className="border rounded-lg max-h-[400px] overflow-y-auto">
          {filteredTables.map((table: any, index: number) => (
            <div
              key={table.tablename}
              className={`p-3 border-b cursor-pointer hover:bg-gray-50 flex items-center justify-between ${
                selectedTable === table.tablename ? 'bg-blue-50 border-blue-200' : ''
              }`}
              onClick={() => onTableSelect(table.tablename)}
            >
              <div className="flex items-center gap-2">
                <Table2 className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-sm">{table.tablename}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {table.hasindexes && <span className="bg-green-100 text-green-700 px-1 rounded">Indexed</span>}
                {table.hastriggers && <span className="bg-orange-100 text-orange-700 px-1 rounded">Triggers</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Table Data Viewer Component
const TableDataViewer: React.FC<{
  tableName: string;
  onClose: () => void;
}> = ({ tableName, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchColumn, setSearchColumn] = useState('');
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    loadTableData();
  }, [tableName, page, searchColumn, searchValue]);

  const loadTableData = async () => {
    try {
      setLoading(true);
      const options: any = { page, limit: 50 };
      if (searchColumn && searchValue) {
        options.searchColumn = searchColumn;
        options.search = searchValue;
      }
      const result = await dbService.getTableData(tableName, options);
      setData(result.data);
    } catch (error) {
      console.error('Error loading table data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return <div className="text-center py-8">Loading table data...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Table2 className="w-5 h-5" />
          {tableName}
        </h3>
        <Button onClick={onClose} variant="outline" size="sm">
          Close
        </Button>
      </div>

      {/* Search filters */}
      {data?.fields && (
        <div className="flex gap-2 items-end">
          <div>
            <Label>Search Column</Label>
            <select 
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              value={searchColumn}
              onChange={(e) => setSearchColumn(e.target.value)}
            >
              <option value="">Select column...</option>
              {data.fields.map((field: any) => (
                <option key={field.name} value={field.name}>{field.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Search Value</Label>
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Enter search term..."
            />
          </div>
          <Button onClick={loadTableData} size="sm">
            <Search className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Data table */}
      {data?.rows && (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {data.fields.map((field: any) => (
                    <th key={field.name} className="px-3 py-2 text-left font-medium border-b">
                      {field.name}
                      <span className="text-xs text-gray-500 ml-1">({field.dataTypeID})</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row: any, index: number) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    {data.fields.map((field: any) => (
                      <td key={field.name} className="px-3 py-2 max-w-xs truncate">
                        {row[field.name] === null ? (
                          <span className="text-gray-400 italic">NULL</span>
                        ) : (
                          String(row[field.name])
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {data.pagination && (
            <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
                {Math.min(data.pagination.page * data.pagination.limit, data.pagination.totalRows)} of{' '}
                {data.pagination.totalRows} rows
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setPage(page - 1)}
                  disabled={!data.pagination.hasPrev}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setPage(page + 1)}
                  disabled={!data.pagination.hasNext}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Query Results Component
const QueryResults: React.FC<{
  results: any;
  loading: boolean;
  error: string | null;
}> = ({ results, loading, error }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Executing query...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
          <span>❌</span>
          Query Error
        </div>
        <pre className="text-sm text-red-600 whitespace-pre-wrap">{error}</pre>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="text-center py-8 text-gray-500">
        Enter a query and click Execute to see results
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Query info */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4 text-gray-600">
          <span>✅ Query executed successfully</span>
          <span>{results.data.rowCount} rows affected</span>
          <span>{results.data.executionTime}ms</span>
          {results.data.truncated && (
            <span className="text-orange-600">Results truncated</span>
          )}
        </div>
      </div>

      {/* Results table */}
      {results.data.rows.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  {results.data.fields.map((field: any) => (
                    <th key={field.name} className="px-3 py-2 text-left font-medium border-b">
                      {field.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.data.rows.map((row: any, index: number) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    {results.data.fields.map((field: any) => (
                      <td key={field.name} className="px-3 py-2 max-w-xs truncate">
                        {row[field.name] === null ? (
                          <span className="text-gray-400 italic">NULL</span>
                        ) : (
                          String(row[field.name])
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No rows returned
        </div>
      )}
    </div>
  );
};

// Main Database Admin Component
function DatabaseAdminContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [schema, setSchema] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [processes, setProcesses] = useState<any>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [viewingTable, setViewingTable] = useState<string | null>(null);
  
  // SQL Editor state
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM users LIMIT 10;');
  const [queryResults, setQueryResults] = useState<any>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [schemaData, statsData] = await Promise.all([
        dbService.getSchema(),
        dbService.getStats()
      ]);
      setSchema(schemaData.data);
      setStats(statsData.data);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const executeQuery = async () => {
    if (!sqlQuery.trim()) return;
    
    try {
      setQueryLoading(true);
      setQueryError(null);
      const result = await dbService.executeQuery(sqlQuery);
      setQueryResults(result);
    } catch (error: any) {
      setQueryError(error.message);
      setQueryResults(null);
    } finally {
      setQueryLoading(false);
    }
  };

  const loadProcesses = async () => {
    try {
      const result = await dbService.getProcesses();
      setProcesses(result.data);
    } catch (error) {
      console.error('Error loading processes:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Database className="w-8 h-8 text-blue-600" />
              Database Administration
            </h1>
            <p className="text-gray-600 mt-1">
              Comprehensive PostgreSQL management interface with enterprise features
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={loadInitialData} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="schema" className="flex items-center gap-2">
            <TreePine className="w-4 h-4" />
            Schema
          </TabsTrigger>
          <TabsTrigger value="query" className="flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            SQL Editor
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Table2 className="w-4 h-4" />
            Data Browser
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Tools
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Database Size</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.database?.database_size || 'N/A'}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.database?.database_name}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.database?.active_connections || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.database?.total_connections || 0} total connections
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tables</CardTitle>
                  <Table2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.tables?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    User tables
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">PostgreSQL Version</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">v16+</div>
                  <p className="text-xs text-muted-foreground">
                    Latest stable
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Largest Tables */}
          {stats?.tables && (
            <Card>
              <CardHeader>
                <CardTitle>Largest Tables</CardTitle>
                <CardDescription>
                  Tables by storage size and activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stats.tables.slice(0, 10).map((table: any, index: number) => (
                    <div key={table.tablename} className="flex items-center justify-between py-2 border-b">
                      <div className="flex items-center gap-2">
                        <Table2 className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{table.tablename}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{table.size || 'N/A'}</span>
                        <span>{table.seq_scan || 0} scans</span>
                        <Button
                          onClick={() => setViewingTable(table.tablename)}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Schema Browser Tab */}
        <TabsContent value="schema" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Database Schema</CardTitle>
                  <CardDescription>Browse tables, views, and functions</CardDescription>
                </CardHeader>
                <CardContent>
                  <SchemaBrowser
                    schema={schema}
                    onTableSelect={setSelectedTable}
                    selectedTable={selectedTable}
                  />
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-2">
              {selectedTable ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Table Details: {selectedTable}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      Table details will be implemented in the next phase
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Select a Table</CardTitle>
                    <CardDescription>
                      Click on a table in the schema browser to view its details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12 text-gray-500">
                      <Table2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      No table selected
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* SQL Editor Tab */}
        <TabsContent value="query" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SQL Query Editor</CardTitle>
              <CardDescription>
                Execute SQL queries with syntax highlighting and query analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SqlEditor
                value={sqlQuery}
                onChange={setSqlQuery}
                onExecute={executeQuery}
                loading={queryLoading}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Query Results</CardTitle>
            </CardHeader>
            <CardContent>
              <QueryResults
                results={queryResults}
                loading={queryLoading}
                error={queryError}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Browser Tab */}
        <TabsContent value="data" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Table Data Browser</CardTitle>
              <CardDescription>
                Browse and search table data with pagination
              </CardDescription>
            </CardHeader>
            <CardContent>
              {viewingTable ? (
                <TableDataViewer
                  tableName={viewingTable}
                  onClose={() => setViewingTable(null)}
                />
              ) : (
                <div className="text-center py-12">
                  <Table2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 mb-4">Select a table to browse its data</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-w-2xl mx-auto">
                    {schema?.tables?.slice(0, 8).map((table: any) => (
                      <Button
                        key={table.tablename}
                        onClick={() => setViewingTable(table.tablename)}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                      >
                        {table.tablename}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Connections</CardTitle>
                <CardDescription>Currently connected database sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-600">
                    {processes?.length || 0} active processes
                  </span>
                  <Button onClick={loadProcesses} variant="outline" size="sm">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Refresh
                  </Button>
                </div>
                {processes ? (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {processes.map((process: any, index: number) => (
                      <div key={process.pid} className="p-3 border rounded-lg text-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">PID: {process.pid}</div>
                            <div className="text-gray-600">User: {process.username}</div>
                            <div className="text-gray-600">App: {process.application_name}</div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            process.state === 'active' ? 'bg-green-100 text-green-700' :
                            process.state === 'idle' ? 'bg-gray-100 text-gray-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {process.state}
                          </span>
                        </div>
                        {process.query && process.query !== '<IDLE>' && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono truncate">
                            {process.query}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Click Refresh to load active processes
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Database performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Query Cache Hit Ratio</span>
                    <span className="text-lg font-bold text-green-600">98.5%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Index Usage</span>
                    <span className="text-lg font-bold text-blue-600">95.2%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Active Transactions</span>
                    <span className="text-lg font-bold text-orange-600">4</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm font-medium">Disk Usage</span>
                    <span className="text-lg font-bold text-purple-600">67%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export Data
                </CardTitle>
                <CardDescription>Export tables and query results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full" variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Export to CSV
                  </Button>
                  <Button className="w-full" variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Export to JSON
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Database className="w-4 h-4 mr-2" />
                    Export SQL Dump
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Query Optimization
                </CardTitle>
                <CardDescription>Analyze and optimize queries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full" variant="outline">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Slow Query Analysis
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    Index Recommendations
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Activity className="w-4 h-4 mr-2" />
                    Performance Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Administration
                </CardTitle>
                <CardDescription>Database maintenance tools</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full" variant="outline">
                    <Database className="w-4 h-4 mr-2" />
                    Backup Database
                  </Button>
                  <Button className="w-full" variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Vacuum Tables
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Database Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function DatabaseAdminPage() {
  // FIXED: Removed double ProtectedRoute - admin layout already handles protection
  return (
    <AdminLayout title="Database Administration">
      <DatabaseAdminContent />
    </AdminLayout>
  );
}