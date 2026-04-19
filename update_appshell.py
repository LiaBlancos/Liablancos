import os

path = r'c:\Users\Mert kuzucu\Desktop\wms-master\src\components\AppShell.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Check if already updated
if 'Mobile Accounting Group' in content:
    print('Already updated')
    exit(0)

# Define the block to insert after
# We look for the end of the mobile finance navigation block
search_pattern = 'isFinanceOpen ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0 overflow-hidden"'
parts = content.split(search_pattern)

if len(parts) > 1:
    # Now find the closing divs of that section
    sub_parts = parts[1].split('</div>\n                                </div>\n                            </div>\n                        </div>')
    
    if len(sub_parts) > 1:
        insertion = """
                    {/* Mobile Accounting Group */}
                    <div className="pt-2">
                        <button
                            onClick={() => setIsAccountingOpen(!isAccountingOpen)}
                            className={cn(
                                "flex items-center justify-between w-full px-6 py-4 rounded-2xl transition-all",
                                pathname.startsWith('/muhasebe') ? "text-white" : "text-slate-400"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <Receipt className="w-6 h-6" />
                                <span className="font-black uppercase tracking-widest text-sm">Muhasebe</span>
                            </div>
                            <ChevronDown className={cn(
                                "w-5 h-5 transition-transform duration-300",
                                isAccountingOpen ? "rotate-0" : "-rotate-90"
                            )} />
                        </button>

                        <div className={cn(
                            "grid transition-all duration-300 ease-in-out",
                            isAccountingOpen ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0 overflow-hidden"
                        )}>
                            <div className="overflow-hidden space-y-2">
                                {accountingNavigation.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={cn(
                                            "flex items-center gap-4 ml-8 px-6 py-4 rounded-2xl transition-all",
                                            pathname === item.href
                                                ? "bg-white/10 text-white"
                                                : "text-slate-400 hover:bg-white/5"
                                        )}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span className="font-medium">{item.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>"""
        
        parts[1] = sub_parts[0] + '</div>\n                                </div>\n                            </div>\n                        </div>' + insertion + '</div>\n                                </div>\n                            </div>\n                        </div>'.join(sub_parts[1:])
        new_content = search_pattern.join(parts)
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print('Successfully updated mobile menu')
    else:
        # Try a slightly different split target if the first one fails
        print('Could not find specific closing structure for mobile finance section')
else:
    print('Search pattern not found')
