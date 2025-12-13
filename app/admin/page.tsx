"use client"
import { useState, useEffect, useMemo } from "react";
import { auth, db, storage, Product, Category } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { LogOut, Plus, Trash2, Package, Grid, LayoutDashboard, Upload, X, Save, Edit, Menu, ChevronLeft, Image as ImageIcon, DollarSign, Tag, Layers, Box, Search, ChevronRight, Filter, ArrowUp, ArrowDown, SlidersHorizontal, Eye } from "lucide-react";
import Image from "next/image";
import { refreshHomeData } from "@/app/actions"; 

// --- Tipos para ordenar los productos ---
type SortKey = "name" | "price" | "stock";
type SortOrder = "asc" | "desc";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"products" | "categories" | "form-product" | "form-category">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
    
  // --- ESTADOS PARA BUSCADOR, FILTRO Y ORDENAMIENTO ---
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(""); 
  const [sortBy, setSortBy] = useState<SortKey>("name"); 
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc"); 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- ESTADOS FORMULARIO ---
  const [prodForm, setProdForm] = useState({ 
      name: "", price: "", originalPrice: "", description: "", categoryId: "", stock: "10", imageUrl: "", images: [] as string[]
  });
  const [prodFiles, setProdFiles] = useState<File[]>([]);
  const [prodPreviews, setProdPreviews] = useState<string[]>([]); // URLs temporales para previsualización
  const [prodSpecs, setProdSpecs] = useState<{key: string, value: string}[]>([]);
  const [specInput, setSpecInput] = useState({ key: "", value: "" });

  const [catForm, setCatForm] = useState({ name: "", icon: "🎁", imageUrl: "" });
  const [catFile, setCatFile] = useState<File | null>(null);

  // --- CARGA DE DATOS ---
  const fetchData = async () => {
    setLoadingData(true);
    try {
        const pSnap = await getDocs(collection(db, "products"));
        const cSnap = await getDocs(collection(db, "categories"));
        
        setProducts(pSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
        setCategories(cSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    } catch (error) {
        console.error("Error cargando datos:", error);
    } finally {
        setLoadingData(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- EFECTO: PREVISUALIZACIÓN DE IMÁGENES DE PRODUCTO ---
  // Genera URLs temporales cuando el usuario selecciona archivos nuevos
  useEffect(() => {
    if (prodFiles.length === 0) {
      setProdPreviews([]);
      return;
    }
    const newPreviews = prodFiles.map(file => URL.createObjectURL(file));
    setProdPreviews(newPreviews);
    // Limpieza de memoria al desmontar o cambiar archivos
    return () => newPreviews.forEach(url => URL.revokeObjectURL(url));
  }, [prodFiles]);

  // --- LÓGICA DE FILTRADO Y ORDENAMIENTO ---
  const sortedAndFilteredProducts = useMemo(() => {
    let filtered = products.filter(p => {
        const nameMatch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const categoryMatch = selectedCategory ? p.categoryId === selectedCategory : true;
        return nameMatch && categoryMatch;
    });

    filtered.sort((a, b) => {
        let valueA: any = a[sortBy];
        let valueB: any = b[sortBy];

        if (sortBy === 'price' || sortBy === 'stock') {
            valueA = Number(valueA) || 0;
            valueB = Number(valueB) || 0;
        } else if (typeof valueA === 'string') {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
        }

        if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
        if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
        return 0;
    });

    return filtered;
  }, [products, searchTerm, selectedCategory, sortBy, sortOrder]);

  const filteredProducts = sortedAndFilteredProducts; 
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
      (currentPage - 1) * itemsPerPage, 
      currentPage * itemsPerPage
  );

  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedCategory, sortBy, sortOrder]);

  const filterByCategoryAndRedirect = (categoryId: string) => {
    setActiveTab("products");
    setSelectedCategory(categoryId);
    setSearchTerm("");
  };

  const resetForms = () => {
    setEditingId(null);
    setProdForm({ name: "", price: "", originalPrice: "", description: "", categoryId: "", stock: "10", imageUrl: "", images: [] });
    setProdFiles([]);
    setProdPreviews([]);
    setProdSpecs([]);
    setCatForm({ name: "", icon: "🎁", imageUrl: "" });
    setCatFile(null);
  };

  const handleEditProduct = (p: Product) => {
    setEditingId(p.id);
    setProdForm({
      name: p.name, price: String(p.price), originalPrice: String(p.originalPrice || ""), description: p.description,
      categoryId: p.categoryId, stock: String(p.stock), imageUrl: p.imageUrl, images: p.images || []
    });
    if (p.specifications) setProdSpecs(Object.entries(p.specifications).map(([key, value]) => ({ key, value })));
    else setProdSpecs([]);
    setProdFiles([]);
    setActiveTab("form-product");
    setSidebarOpen(false);
  };

  const handleEditCategory = (c: Category) => {
    setEditingId(c.id);
    setCatForm({ name: c.name, icon: c.icon, imageUrl: c.imageUrl });
    setCatFile(null); 
    setActiveTab("form-category");
    setSidebarOpen(false);
  };

  const handleDeleteImage = async (imageUrl: string) => {
    if (!imageUrl) return;
    try {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
    } catch (error) {
        console.warn("Imagen ya no existe o error:", error);
    }
  };

  const uploadFile = async (file: File, path: string) => {
    const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.categoryId) return alert("Selecciona categoría");
    if (!editingId && prodFiles.length === 0) return alert("Sube al menos una imagen");

    setUploading(true);
    try {
      let imageUrls = prodForm.images;
      // Si hay archivos nuevos, los subimos y obtenemos URLs
      if (prodFiles.length > 0) {
        const newUrls = await Promise.all(prodFiles.map(file => uploadFile(file, "products")));
        imageUrls = newUrls; 
      }

      const finalSpecs = [...prodSpecs];
      if (specInput.key && specInput.value) finalSpecs.push(specInput);
      const specsObject: Record<string, string> = {};
      finalSpecs.forEach(s => specsObject[s.key] = s.value);
      const selectedCat = categories.find(c => c.id === prodForm.categoryId);
      
      const productData = {
        name: prodForm.name,
        price: parseFloat(prodForm.price),
        originalPrice: parseFloat(prodForm.originalPrice) || (parseFloat(prodForm.price) * 1.2),
        description: prodForm.description,
        imageUrl: imageUrls[0] || prodForm.imageUrl,
        images: imageUrls,
        categoryId: prodForm.categoryId,
        categorySlug: selectedCat?.slug || "varios",
        stock: parseInt(prodForm.stock),
        specifications: specsObject,
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, "products", editingId), productData);
      } else {
        await addDoc(collection(db, "products"), { ...productData, createdAt: serverTimestamp() });
      }

      await refreshHomeData(); 
      alert("Producto guardado correctamente");
      resetForms(); setActiveTab("products"); fetchData();
    } catch (error) { console.error(error); alert("Error al guardar"); }
    setUploading(false);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId && !catFile) return alert("Sube una imagen");
    setUploading(true);
    try {
        let url = catForm.imageUrl;
        if (catFile) {
            if (editingId && catForm.imageUrl) await handleDeleteImage(catForm.imageUrl);
            url = await uploadFile(catFile, "categories");
        }
        const slug = catForm.name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
        const catData = { name: catForm.name, slug, imageUrl: url, icon: catForm.icon, updatedAt: serverTimestamp() };

        if (editingId) await updateDoc(doc(db, "categories", editingId), catData);
        else await addDoc(collection(db, "categories"), { ...catData, createdAt: serverTimestamp() });
        
        await refreshHomeData();
        resetForms(); setActiveTab("categories"); fetchData();
    } catch (e) { console.error(e); alert("Error al guardar"); }
    setUploading(false);
  }

  const handleDelete = async (col: string, id: string) => {
    if(confirm("¿Estás seguro de eliminar esto?")) { 
        await deleteDoc(doc(db, col, id)); 
        await refreshHomeData();
        fetchData(); 
    }
  };

  const addSpec = (e: React.MouseEvent) => {
    e.preventDefault();
    if(specInput.key && specInput.value) {
      setProdSpecs([...prodSpecs, specInput]);
      setSpecInput({ key: "", value: "" });
    }
  };
  const removeSpec = (index: number) => {
     const newSpecs = [...prodSpecs];
     newSpecs.splice(index, 1);
     setProdSpecs(newSpecs);
  };

  // Previsualización para categoría (URL Blob si hay archivo nuevo, sino URL de la DB)
  const categoryPreviewUrl = catFile ? URL.createObjectURL(catFile) : catForm.imageUrl;

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-[#0f111a] text-slate-200">
      
      {/* --- SIDEBAR --- */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#161b28] border-r border-slate-800/60 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static
      `}>
        <div className="h-24 flex items-center px-6 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
             <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
                <LayoutDashboard className="text-white" size={22} />
             </div>
             <div>
                <h1 className="text-xl font-black text-white tracking-tight leading-none">Admin<span className="text-blue-500">Panel</span></h1>
             </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-8 overflow-y-auto scrollbar-hide">
            <div>
                <h3 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest px-3 mb-4">Gestión</h3>
                <div className="flex flex-col gap-2">
                    <button onClick={() => { setActiveTab("products"); setSidebarOpen(false); resetForms(); }} className={`nav-btn ${activeTab === "products" ? "active" : "inactive"}`}>
                        <Package size={20} /> <span className="font-medium">Inventario</span>
                    </button>
                    <button onClick={() => { setActiveTab("categories"); setSidebarOpen(false); resetForms(); }} className={`nav-btn ${activeTab === "categories" ? "active" : "inactive"}`}>
                        <Layers size={20} /> <span className="font-medium">Categorías</span>
                    </button>
                </div>
            </div>
            <div>
                <h3 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest px-3 mb-4">Acciones</h3>
                <div className="flex flex-col gap-2">
                    <button onClick={() => { setActiveTab("form-product"); resetForms(); setSidebarOpen(false); }} className={`nav-btn ${activeTab === "form-product" ? "active" : "inactive"}`}>
                        <Plus size={20} /> <span className="font-medium">Nuevo Producto</span>
                    </button>
                    <button onClick={() => { setActiveTab("form-category"); resetForms(); setSidebarOpen(false); }} className={`nav-btn ${activeTab === "form-category" ? "active" : "inactive"}`}>
                        <Grid size={20} /> <span className="font-medium">Nueva Categoría</span>
                    </button>
                </div>
            </div>
        </nav>
        
        <div className="p-4 border-t border-slate-800/60 bg-[#121622]">
            <button onClick={() => signOut(auth)} className="w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all group cursor-pointer border border-slate-800 hover:border-slate-700 hover:shadow-lg">
                <LogOut size={18} className="group-hover:text-red-400 transition-colors"/> Cerrar Sesión
            </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 relative overflow-y-auto h-full bg-[#0f111a] scroll-smooth">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-[#161b28] sticky top-0 z-40 shadow-lg shadow-black/20">
            <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-1.5 rounded-lg"><LayoutDashboard className="text-white" size={18} /></div>
                <div className="font-bold text-white text-lg">AdminPanel</div>
            </div>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 active:scale-95 transition-all"><Menu size={26}/></button>
        </div>

        <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-full">
            
            {/* VISTA: LISTA DE PRODUCTOS */}
            {activeTab === "products" && (
                <div className="space-y-6 animate-in fade-in duration-500">
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-5 pb-6 border-b border-slate-800/60">
                      <div>
                          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Inventario</h1>
                          <p className="text-slate-400 mt-2 text-sm font-medium">
                            <span className="text-blue-500 font-bold">{filteredProducts.length}</span> productos encontrados.
                          </p>
                      </div>
                      <div className="flex items-center gap-3 w-full md:w-auto">
                          <div className="relative flex-1 md:w-72 group">
                              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                              <input 
                                type="text" 
                                placeholder="Buscar por nombre..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-[#1e2330] border border-slate-700/50 text-white pl-11 pr-4 py-3 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm transition-all shadow-sm"
                              />
                          </div>
                          <button onClick={() => setActiveTab("form-product")} className="btn-primary shrink-0 h-[46px]">
                              <Plus size={20} strokeWidth={3} /> <span className="hidden sm:inline">Nuevo</span>
                          </button>
                      </div>
                   </div>

                   {/* Filtros y Ordenamiento */}
                   <div className="bg-[#161b28] p-4 rounded-2xl border border-slate-800/60 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
                      <div className="flex items-center gap-2 text-slate-400 text-sm font-medium w-full md:w-auto px-1">
                          <SlidersHorizontal size={18} className="text-blue-500"/> <span>Filtros:</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                          <div className="relative w-full sm:w-56">
                              <select 
                                  value={selectedCategory} 
                                  onChange={(e) => setSelectedCategory(e.target.value)} 
                                  className="w-full bg-[#0f111a] border border-slate-700 text-slate-200 pl-4 pr-10 py-2.5 rounded-xl focus:border-blue-500 outline-none text-sm appearance-none cursor-pointer hover:border-slate-600 transition-colors"
                              >
                                  <option value="">Todas las Categorías</option>
                                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                              </select>
                              <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
                          </div>
                          <div className="relative w-full sm:w-40">
                              <select 
                                  value={sortBy} 
                                  onChange={(e) => setSortBy(e.target.value as SortKey)} 
                                  className="w-full bg-[#0f111a] border border-slate-700 text-slate-200 pl-4 pr-10 py-2.5 rounded-xl focus:border-blue-500 outline-none text-sm appearance-none cursor-pointer hover:border-slate-600 transition-colors"
                              >
                                  <option value="name">Nombre</option>
                                  <option value="price">Precio</option>
                                  <option value="stock">Stock</option>
                              </select>
                              <ArrowUp size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none rotate-45"/>
                          </div>
                          <button 
                              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                              className="p-2.5 rounded-xl bg-[#0f111a] border border-slate-700 text-slate-400 hover:text-white hover:border-blue-500 transition-all flex justify-center items-center w-full sm:w-auto"
                          >
                              {sortOrder === "asc" ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                          </button>
                      </div>
                   </div>

                   {/* Grid de Productos */}
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {loadingData ? (
                          <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500">
                             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                             Cargando...
                          </div>
                      ) : filteredProducts.length === 0 ? (
                          <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl opacity-60">
                              <Package size={64} className="text-slate-600 mb-4"/>
                              <p className="text-slate-400 font-medium">No se encontraron productos.</p>
                          </div>
                      ) : (
                          paginatedProducts.map(p => (
                              <div key={p.id} className="bg-[#161b28] border border-slate-800/60 rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-blue-900/10 hover:border-blue-500/50 hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                                  <div className="aspect-square relative bg-[#0f111a] overflow-hidden border-b border-slate-800/60">
                                      <Image src={p.imageUrl || "/placeholder.svg"} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500"/>
                                      {/* EDICIÓN: Agregado clases 'opacity-100 lg:opacity-0' para que sea visible en móvil siempre */}
                                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3 backdrop-blur-[2px] transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
                                          <button onClick={() => handleEditProduct(p)} className="bg-white text-slate-900 p-3 rounded-xl hover:bg-blue-500 hover:text-white hover:scale-110 transition-all shadow-xl" title="Editar"><Edit size={18}/></button>
                                          <button onClick={() => handleDelete("products", p.id)} className="bg-white text-slate-900 p-3 rounded-xl hover:bg-red-500 hover:text-white hover:scale-110 transition-all shadow-xl" title="Eliminar"><Trash2 size={18}/></button>
                                      </div>
                                      <div className="absolute bottom-3 left-3">
                                        <span className="text-[10px] font-bold bg-[#161b28]/90 backdrop-blur-md border border-slate-700 text-slate-300 px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">
                                            {categories.find(c => c.id === p.categoryId)?.name || "Sin Cat."}
                                        </span>
                                      </div>
                                  </div>
                                  
                                  <div className="p-5 flex flex-col flex-1">
                                      <div className="flex-1">
                                          <h3 className="font-bold text-white text-lg leading-tight mb-2 line-clamp-1" title={p.name}>{p.name}</h3>
                                          <p className="text-slate-500 text-xs line-clamp-2 mb-4 h-8">{p.description || "Sin descripción disponible."}</p>
                                      </div>
                                      <div className="flex items-end justify-between pt-4 border-t border-slate-800/50 mt-2">
                                          <div>
                                              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Precio</p>
                                              <p className="text-emerald-400 font-bold text-xl">S/ {p.price}</p>
                                          </div>
                                          <div className="text-right">
                                              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Stock</p>
                                              <div className="flex items-center gap-1.5 text-slate-300 bg-[#0f111a] px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-800">
                                                  <Box size={12} className="text-blue-500"/> {p.stock}
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          ))
                      )}
                   </div>

                   {/* Paginación */}
                   {filteredProducts.length > itemsPerPage && (
                       <div className="flex justify-center items-center gap-4 pt-8 pb-4">
                           <button 
                             onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                             disabled={currentPage === 1}
                             className="p-3 rounded-xl bg-[#161b28] border border-slate-800 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all"
                           >
                             <ChevronLeft size={20} />
                           </button>
                           <span className="text-sm font-medium text-slate-500 bg-[#161b28] px-6 py-3 rounded-xl border border-slate-800 shadow-sm">
                             Página <span className="text-white font-bold mx-1">{currentPage}</span> de <span className="text-white font-bold mx-1">{totalPages}</span>
                           </span>
                           <button 
                             onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                             disabled={currentPage === totalPages}
                             className="p-3 rounded-xl bg-[#161b28] border border-slate-800 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all"
                           >
                             <ChevronRight size={20} />
                           </button>
                       </div>
                   )}
                </div>
            )}

            {/* VISTA: LISTA DE CATEGORÍAS */}
            {activeTab === "categories" && (
                <div className="space-y-8 animate-in fade-in duration-500">
                   <div className="flex justify-between items-center pb-6 border-b border-slate-800/60">
                      <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Categorías</h1>
                        <p className="text-slate-400 mt-1 text-sm">Organización de la tienda.</p>
                      </div>
                      <button onClick={() => {setActiveTab("form-category"); resetForms()}} className="btn-primary h-[46px]"><Plus size={20} strokeWidth={3} /> Nueva</button>
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                       {categories.map(c => (
                           <div 
                             key={c.id} 
                             onClick={() => filterByCategoryAndRedirect(c.id)}
                             className="bg-[#161b28] rounded-3xl p-6 flex flex-col items-center text-center border border-slate-800 hover:border-blue-500/50 hover:bg-[#1c2230] hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-2 transition-all group relative cursor-pointer"
                           >
                               {/* EDICIÓN: Agregado clases 'opacity-100 lg:opacity-0' para que sea visible en móvil siempre */}
                               <div className="absolute top-3 right-3 flex gap-1 z-10 transition-all opacity-100 scale-100 lg:opacity-0 lg:group-hover:opacity-100 lg:scale-90 lg:group-hover:scale-100">
                                   <button onClick={(e) => {e.stopPropagation(); handleEditCategory(c);}} className="p-2 bg-[#0f111a] text-blue-400 rounded-xl hover:bg-blue-500 hover:text-white transition-colors border border-slate-800 shadow-lg"><Edit size={14}/></button>
                                   <button onClick={(e) => {e.stopPropagation(); handleDelete("categories", c.id);}} className="p-2 bg-[#0f111a] text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-colors border border-slate-800 shadow-lg"><Trash2 size={14}/></button>
                               </div>
                               <div className="w-24 h-24 rounded-full bg-[#0f111a] border-2 border-slate-800 mb-5 relative overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
                                   <Image src={c.imageUrl || "/placeholder.svg"} alt="" fill className="object-cover opacity-60 group-hover:opacity-100 transition-all duration-500"/>
                               </div>
                               <div className="text-4xl mb-3 drop-shadow-md transform group-hover:scale-110 transition-transform duration-300">{c.icon}</div>
                               <div className="font-bold text-white text-lg">{c.name}</div>
                           </div>
                       ))}
                   </div>
                </div>
            )}

            {/* FORMULARIOS: PRODUCTO Y CATEGORÍA */}
            {(activeTab === "form-product" || activeTab === "form-category") && (
                <div className="animate-in slide-in-from-right-8 duration-500">
                    
                    {/* --- FORMULARIO PRODUCTO --- */}
                    {activeTab === "form-product" && (
                        <div className="max-w-5xl mx-auto pb-20">
                          <div className="flex items-center gap-4 mb-8">
                            <button onClick={() => { setActiveTab("products"); resetForms(); }} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all cursor-pointer">
                              <ChevronLeft size={20}/>
                            </button>
                            <div>
                              <h2 className="text-2xl font-black text-white tracking-tight">{editingId ? "Editar Producto" : "Crear Nuevo Producto"}</h2>
                              <p className="text-slate-400 text-sm">Rellena los detalles del artículo.</p>
                            </div>
                          </div>

                          <form onSubmit={handleSaveProduct} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* COLUMNA IZQUIERDA: Info General y Precios */}
                            <div className="lg:col-span-2 space-y-6">
                              {/* Tarjeta 1: Información Básica */}
                              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-6 border-b border-slate-800/80 pb-4">
                                  <div className="bg-blue-500/10 p-2 rounded-xl text-blue-500"><Tag size={20}/></div>
                                  <h3 className="font-bold text-white text-lg">Información Básica</h3>
                                </div>
                                <div className="space-y-5">
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nombre</label>
                                    <input className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-4 focus:border-blue-500 focus:ring-1 outline-none" value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} placeholder="Ej: Auto de Carreras" required />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Descripción</label>
                                    <textarea className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-4 focus:border-blue-500 focus:ring-1 outline-none h-32 resize-none" value={prodForm.description} onChange={e => setProdForm({...prodForm, description: e.target.value})} placeholder="Características..." required />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Categoría</label>
                                    <div className="relative">
                                      <select className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-4 pr-10 focus:border-blue-500 focus:ring-1 outline-none appearance-none" value={prodForm.categoryId} onChange={e => setProdForm({...prodForm, categoryId: e.target.value})} required>
                                        <option value="" className="text-slate-500">-- Seleccionar --</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                                      </select>
                                      <ChevronLeft size={16} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-270 text-slate-500 pointer-events-none"/>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Tarjeta 2: Precios e Inventario */}
                              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-6 border-b border-slate-800/80 pb-4">
                                  <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-500"><DollarSign size={20}/></div>
                                  <h3 className="font-bold text-white text-lg">Precios & Inventario</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-emerald-500 uppercase ml-1">Precio Venta</label>
                                    <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-bold z-10">S/</span><input type="number" className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 pl-10 pr-4 focus:border-emerald-500 focus:ring-1 outline-none font-bold text-lg" value={prodForm.price} onChange={e => setProdForm({...prodForm, price: e.target.value})} required /></div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Precio Real</label>
                                    <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-medium z-10">S/</span><input type="number" className="w-full bg-slate-950 border border-slate-800 text-slate-400 rounded-xl py-3 pl-10 pr-4 focus:border-slate-600 outline-none" value={prodForm.originalPrice} onChange={e => setProdForm({...prodForm, originalPrice: e.target.value})} /></div>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Stock</label>
                                    <input type="number" className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 px-4 focus:border-blue-500 focus:ring-1 outline-none" value={prodForm.stock} onChange={e => setProdForm({...prodForm, stock: e.target.value})} required />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* COLUMNA DERECHA: Imágenes y Especificaciones */}
                            <div className="space-y-6">
                              {/* Tarjeta 3: Imágenes */}
                              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-6 border-b border-slate-800/80 pb-4">
                                  <div className="bg-purple-500/10 p-2 rounded-xl text-purple-500"><ImageIcon size={20}/></div>
                                  <h3 className="font-bold text-white text-lg">Imágenes</h3>
                                </div>
                                {/* Vista previa: muestra imágenes nuevas (prodPreviews) o existentes (prodForm.images) */}
                                {(prodPreviews.length > 0 || (editingId && prodForm.images.length > 0)) && (
                                  <div className="grid grid-cols-4 gap-2 mb-4">
                                    {(prodPreviews.length > 0 ? prodPreviews : prodForm.images).slice(0,4).map((img, i) => (
                                      <div key={i} className="aspect-square rounded-xl bg-slate-950 border border-slate-800 relative overflow-hidden">
                                        <Image src={img} alt="" fill className="object-cover"/>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                <label className="relative flex flex-col items-center justify-center w-full h-48 border-2 border-slate-700 border-dashed rounded-2xl cursor-pointer bg-slate-950/30 hover:bg-slate-900 hover:border-blue-500 transition-all group overflow-hidden">
                                  <div className="flex flex-col items-center justify-center pt-5 pb-6 relative z-10">
                                    <div className="bg-slate-800 p-3 rounded-full mb-3 group-hover:scale-110 shadow-lg"><Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-500" /></div>
                                    <p className="text-sm text-slate-400 group-hover:text-white font-medium">{prodFiles.length > 0 ? <span className="text-emerald-400">{prodFiles.length} fotos</span> : "Subir imágenes"}</p>
                                  </div>
                                  <input type="file" multiple className="hidden" onChange={e => e.target.files && setProdFiles(Array.from(e.target.files))} />
                                </label>
                              </div>

                              {/* Tarjeta 4: Especificaciones */}
                              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-sm">
                                <h3 className="font-bold text-white mb-4 text-xs uppercase text-slate-400 tracking-wider ml-1">Especificaciones</h3>
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {prodSpecs.map((s, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-slate-950 border border-slate-800 pl-3 pr-2 py-1.5 rounded-lg text-xs group hover:border-slate-700">
                                      <span className="text-slate-300"><strong className="text-white">{s.key}:</strong> {s.value}</span>
                                      <button type="button" onClick={() => removeSpec(i)} className="text-slate-600 hover:text-red-400 p-0.5 rounded"><X size={14}/></button>
                                    </div>
                                  ))}
                                </div>
                                <div className="space-y-2 p-3 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                                  <input placeholder="Ej: Material" className="w-full bg-slate-900 border border-slate-800 text-white text-xs p-3 rounded-xl focus:border-slate-600 outline-none" value={specInput.key} onChange={e => setSpecInput({...specInput, key: e.target.value})} />
                                  <div className="flex gap-2">
                                    <input placeholder="Ej: Plástico ABS" className="w-full bg-slate-900 border border-slate-800 text-white text-xs p-3 rounded-xl focus:border-slate-600 outline-none" value={specInput.value} onChange={e => setSpecInput({...specInput, value: e.target.value})} />
                                    <button type="button" onClick={addSpec} className="bg-slate-800 text-blue-500 border border-slate-700 p-3 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Plus size={16}/></button>
                                  </div>
                                </div>
                              </div>

                              {/* Botón Guardar */}
                              <button disabled={uploading} className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
                                {uploading ? "Guardando..." : <><Save size={20}/> Guardar Producto</>}
                              </button>
                            </div>
                          </form>
                        </div>
                    )}

                    {/* --- FORMULARIO CATEGORÍA --- */}
                    {activeTab === "form-category" && (
                        <div className="max-w-4xl mx-auto pb-10 pt-6">
                          <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-4">
                              <button onClick={() => { setActiveTab("categories"); resetForms(); }} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all cursor-pointer">
                                <ChevronLeft size={20}/>
                              </button>
                              <div><h2 className="text-2xl font-black text-white">{editingId ? "Editar Categoría" : "Nueva Categoría"}</h2></div>
                            </div>
                          </div>

                          <form onSubmit={handleSaveCategory} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* COLUMNA IZQUIERDA: Datos */}
                            <div className="space-y-6">
                              <div className="bg-slate-900/80 border border-slate-800 rounded-[2rem] p-8 shadow-lg">
                                <h3 className="font-bold text-white mb-6 text-sm uppercase text-slate-400">Datos Generales</h3>
                                <div className="space-y-5">
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nombre</label>
                                    <input className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-blue-500 focus:ring-1 outline-none text-lg" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} placeholder="Ej: Deportes" required />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Icono</label>
                                    <div className="flex gap-3">
                                      <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-3xl shrink-0">
                                        {catForm.icon}
                                      </div>
                                      <input className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-blue-500 focus:ring-1 outline-none" value={catForm.icon} onChange={e => setCatForm({...catForm, icon: e.target.value})} placeholder="Emoji" required />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* COLUMNA DERECHA: Imagen Portada */}
                            <div className="space-y-6">
                              <div className="bg-slate-900/80 border border-slate-800 rounded-[2rem] p-8 shadow-lg h-full flex flex-col">
                                <h3 className="font-bold text-white mb-6 text-sm uppercase text-slate-400">Imagen de Portada</h3>
                                <div className="flex-1 flex flex-col gap-4">
                                  <div className="relative w-full h-48 rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner">
                                    {categoryPreviewUrl ? (
                                      <Image src={categoryPreviewUrl} alt="Preview" fill className="object-cover" />
                                    ) : (
                                      <div className="flex items-center justify-center h-full text-slate-700">
                                        <ImageIcon size={48} strokeWidth={1.5} />
                                      </div>
                                    )}
                                  </div>
                                  <label className="cursor-pointer group">
                                    <div className="w-full bg-slate-800 border-2 border-dashed border-slate-700 rounded-2xl p-4 flex items-center justify-center gap-3 hover:bg-slate-700 hover:border-emerald-500 transition-all">
                                      <Upload size={20} className="text-slate-400 group-hover:text-white"/>
                                      <span className="text-slate-400 font-medium text-sm group-hover:text-white">{catFile ? "Cambiar imagen" : "Seleccionar imagen"}</span>
                                    </div>
                                    <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files && setCatFile(e.target.files[0])} />
                                  </label>
                                </div>
                                <button disabled={uploading} className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg mt-6 cursor-pointer disabled:opacity-50 active:scale-95 flex justify-center gap-2">
                                  {uploading ? "Guardando..." : <><Save size={20}/> Guardar Categoría</>}
                                </button>
                              </div>
                            </div>
                          </form>
                        </div>
                    )}
                </div>
            )}
        </div>
      </main>

      <style jsx>{`
        .nav-btn { @apply w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all duration-200 cursor-pointer font-bold text-sm border border-transparent; }
        .nav-btn.inactive { @apply text-slate-400 bg-transparent hover:bg-[#202635] hover:text-white hover:border-slate-700; }
        .nav-btn.active { @apply bg-blue-600 text-white shadow-lg shadow-blue-600/20 border-blue-500; }
        .btn-primary { @apply flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95 text-sm cursor-pointer border border-blue-500; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}