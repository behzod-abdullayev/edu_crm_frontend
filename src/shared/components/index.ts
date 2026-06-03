// ─── Layout ───────────────────────────────────────────────────────────────────
export { Sidebar }      from './layout/Sidebar';
export { Header }       from './layout/Header';
export { MobileHeader } from './layout/MobileHeader';
export { Breadcrumb }   from './layout/Breadcrumb';
export { MobileDrawer } from './layout/MobileDrawer';

// ─── Data Display ─────────────────────────────────────────────────────────────
export { DataTable }       from './data-display/DataTable';
export { KPICard }         from './data-display/KPICard';
export { StatCard }        from './data-display/StatCard';
export { EmptyState }      from './data-display/EmptyState';
export { ErrorState }      from './data-display/EmptyState';
export { AvatarWithRole }  from './data-display/AvatarWithRole';

// ─── Feedback ─────────────────────────────────────────────────────────────────
export { Toast }          from './feedback/Toast';
export { SkeletonLoader } from './feedback/SkeletonLoader';
export { PageLoader }     from './feedback/PageLoader';
export { ConfirmDialog }  from './feedback/ConfirmDialog';
export { ErrorBoundary }  from './feedback/ErrorBoundary';

// ─── Forms ────────────────────────────────────────────────────────────────────
export { FormField }       from './forms/FormField';
export { FileUploadZone }  from './forms/FileUploadZone';
export { RichTextEditor }  from './forms/RichTextEditor';
export { DateRangePicker } from './forms/DateRangePicker';
export { SearchInput }     from './forms/SearchInput';

// ─── Navigation ───────────────────────────────────────────────────────────────
export { ThemeToggle }      from './navigation/ThemeToggle';
export { NotificationBell } from './navigation/NotificationBell';
export { UserMenu }         from './navigation/UserMenu';
export { LanguageSwitcher } from './navigation/LanguageSwitcher';
export { GlobalSearch }     from './navigation/GlobalSearch';

// ─── Charts ───────────────────────────────────────────────────────────────────
export { LineChart }      from './charts/LineChart';
export { BarChart }       from './charts/BarChart';
export { PieChart }       from './charts/BarChart';
export { AreaChart }      from './charts/BarChart';
export { SparklineChart } from './charts/BarChart';

// ─── Animations ───────────────────────────────────────────────────────────────
export { PageTransition } from './animations/PageTransition';
export { FadeIn }         from './animations/PageTransition';
export { StaggerList }    from './animations/PageTransition';
export { CountUp }        from './animations/PageTransition';

// ─── UI primitives ────────────────────────────────────────────────────────────
export { Button }                                              from './ui/button';
export type { ButtonProps }                                    from './ui/button';
export { Input }                                               from './ui/button';
export { Label }                                               from './ui/button';
export { Badge }                                               from './ui/button';
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/button';
export {
  Dialog, DialogTrigger, DialogClose, DialogContent,
  DialogHeader, DialogFooter, DialogTitle, DialogDescription,
}                                                              from './ui/dialog';
export {
  Drawer, DrawerTrigger, DrawerClose, DrawerContent,
  DrawerHeader, DrawerTitle, DrawerBody, DrawerFooter,
}                                                              from './ui/drawer';
export {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup,
  DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
  DropdownMenuShortcut, DropdownMenuPortal,
}                                                              from './ui/dropdown-menu';
export {
  Select, SelectGroup, SelectValue, SelectTrigger, SelectContent,
  SelectLabel, SelectItem, SelectSeparator,
  SelectScrollUpButton, SelectScrollDownButton,
}                                                              from './ui/select';
export { Checkbox }                                            from './ui/checkbox';
export { RadioGroup, RadioGroupItem }                          from './ui/checkbox';
export { Switch }                                              from './ui/checkbox';
export { Tabs, TabsList, TabsTrigger, TabsContent, AnimatedTabsList, AnimatedTabsTrigger } from './ui/tabs';
export {
  TooltipProvider, Tooltip, TooltipTrigger, TooltipContent,
}                                                              from './ui/tooltip';
export { Popover, PopoverTrigger, PopoverContent }            from './ui/tooltip';
export { Separator }                                           from './ui/tooltip';
export { Avatar, AvatarImage, AvatarFallback }                from './ui/tooltip';
export { Progress }                                            from './ui/tooltip';
export { Skeleton }                                            from './ui/tooltip';
export {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
}                                                              from './ui/accordion';
export { Alert, AlertTitle, AlertDescription }                from './ui/accordion';
export {
  AlertDialog, AlertDialogTrigger, AlertDialogPortal, AlertDialogOverlay,
  AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction,
}                                                              from './ui/accordion';
export {
  Sheet, SheetTrigger, SheetClose, SheetContent,
  SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter,
}                                                              from './ui/sheet';
export {
  Command, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem, CommandSeparator, CommandShortcut,
}                                                              from './ui/sheet';
export { ScrollArea, ScrollBar }                              from './ui/sheet';
