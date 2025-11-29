"use client"
import { useState, useEffect } from "react";
import { auth, db, storage, Product, Category } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, updateDoc, query, orderBy } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { LogOut, Plus, Trash2, Package, Grid, LayoutDashboard, Upload, X, Save, Edit, Menu, ChevronLeft, Image as ImageIcon, DollarSign, Tag, Layers, Box, Search, ChevronRight } from "lucide-react";
import Image from "next/image";
import { refreshHomeData } from "@/app/actions"; 

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"products" | "categories" | "form-product" | "form-category">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
    
  // --- ESTADOS PARA BUSCADOR Y PAGINACIÓN ---
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- ESTADOS FORMULARIO ---
  const [prodForm, setProdForm] = useState({ 
      name: "", price: "", originalPrice: "", description: "", categoryId: "", stock: "10", imageUrl: "", images: [] as string[]
  });
  const [prodFiles, setProdFiles] = useState<File[]>([]);
  const [prodSpecs, setProdSpecs] = useState<{key: string, value: string}[]>([]);
  const [specInput, setSpecInput] = useState({ key: "", value: "" });

  const [catForm, setCatForm] = useState({ name: "", icon: "🎁", imageUrl: "" });
  const [catFile, setCatFile] = useState<File | null>(null);

  // --- CARGA DE DATOS ---
  const fetchData = async () => {
    setLoadingData(true);
    try {
        // Traemos todo ordenado por fecha de creación (si existe) o por defecto
        // NOTA: Para 200-500 productos, traer todo es MÁS EFICIENTE que buscar en DB
        // porque Firestore cobra por lectura. Buscar letra por letra en DB son muchas lecturas.
        // Traer todo una vez son solo N lecturas y el buscador es instantáneo.
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

  // --- LÓGICA DE FILTRADO Y PAGINACIÓN ---
  const filteredProducts = products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
      (currentPage - 1) * itemsPerPage, 
      currentPage * itemsPerPage
  );

  // Resetear página cuando se busca
  useEffect(() => {
      setCurrentPage(1);
  }, [searchTerm]);

  const resetForms = () => {
    setEditingId(null);
    setProdForm({ name: "", price: "", originalPrice: "", description: "", categoryId: "", stock: "10", imageUrl: "", images: [] });
    setProdFiles([]);
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
      alert("Producto guardado");
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
    if(confirm("¿Eliminar permanentemente?")) { 
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

  const categoryPreviewUrl = catFile ? URL.createObjectURL(catFile) : catForm.imageUrl;

  return (
    <div className="flex h-screen overflow-hidden font-sans bg-slate-950 text-slate-200">
      
      {/* --- SIDEBAR --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static
      `}>
        <div className="h-24 flex items-center px-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
             <div className="bg-gradient-to-tr from-blue-600 to-blue-500 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
                <LayoutDashboard className="text-white" size={24} />
             </div>
             <div>
                <h1 className="text-xl font-black text-white tracking-tight leading-none">Admin<span className="text-blue-500">Panel</span></h1>
             </div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-8 overflow-y-auto scrollbar-hide">
            <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-3 mb-4">Gestión</h3>
                <div className="flex flex-col gap-3">
                    <button onClick={() => { setActiveTab("products"); setSidebarOpen(false); resetForms(); }} className={`nav-btn ${activeTab === "products" ? "active" : "inactive"}`}>
                        <Package size={22} /> <span className="font-medium">Inventario</span>
                    </button>
                    <button onClick={() => { setActiveTab("categories"); setSidebarOpen(false); resetForms(); }} className={`nav-btn ${activeTab === "categories" ? "active" : "inactive"}`}>
                        <Layers size={22} /> <span className="font-medium">Categorías</span>
                    </button>
                </div>
            </div>
            <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-3 mb-4">Acciones</h3>
                <div className="flex flex-col gap-3">
                    <button onClick={() => { setActiveTab("form-product"); resetForms(); setSidebarOpen(false); }} className={`nav-btn ${activeTab === "form-product" ? "active" : "inactive"}`}>
                        <Plus size={22} /> <span className="font-medium">Nuevo Producto</span>
                    </button>
                    <button onClick={() => { setActiveTab("form-category"); resetForms(); setSidebarOpen(false); }} className={`nav-btn ${activeTab === "form-category" ? "active" : "inactive"}`}>
                        <Grid size={22} /> <span className="font-medium">Nueva Categoría</span>
                    </button>
                </div>
            </div>
        </nav>
        
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/50">
            <button onClick={() => signOut(auth)} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all group cursor-pointer border border-slate-800/50">
                <LogOut size={20} className="group-hover:text-red-400 transition-colors"/> Cerrar Sesión
            </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 relative overflow-y-auto h-full bg-slate-950">
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-40">
            <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-1.5 rounded-lg"><LayoutDashboard className="text-white" size={18} /></div>
                <div className="font-bold text-white">AdminPanel</div>
            </div>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"><Menu size={24}/></button>
        </div>

        <div className="p-6 md:p-8 max-w-7xl mx-auto min-h-full">
            
            {/* VISTA: PRODUCTOS (CON BUSCADOR Y PAGINACIÓN) */}
            {activeTab === "products" && (
                <div className="space-y-6">
                   <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-slate-800/80 pb-6">
                      <div>
                          <h1 className="text-3xl font-black text-white tracking-tight">Inventario</h1>
                          <p className="text-slate-400 mt-1 text-sm">
                            Mostrando {paginatedProducts.length} de {filteredProducts.length} productos
                          </p>
                      </div>
                      <div className="flex items-center gap-3 w-full md:w-auto">
                          {/* BUSCADOR */}
                          <div className="relative w-full md:w-64">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                              <input 
                                type="text" 
                                placeholder="Buscar producto..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 text-white pl-10 pr-4 py-2.5 rounded-xl focus:border-blue-500 outline-none text-sm transition-all"
                              />
                          </div>
                          <button onClick={() => setActiveTab("form-product")} className="btn-primary shrink-0">
                              <Plus size={18} strokeWidth={3} /> <span className="hidden sm:inline">Agregar</span>
                          </button>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 gap-4">
                      {loadingData ? (
                          <div className="text-center py-20 text-slate-500">Cargando inventario...</div>
                      ) : paginatedProducts.length === 0 ? (
                          <div className="text-center py-20 rounded-3xl border-2 border-dashed border-slate-800/80 flex flex-col items-center justify-center">
                              <Package size={48} className="text-slate-600 mb-4"/>
                              <p className="text-slate-500 font-medium">
                                {searchTerm ? "No hay resultados para tu búsqueda." : "No hay productos registrados."}
                              </p>
                          </div>
                      ) : (
                          paginatedProducts.map(p => (
                              <div key={p.id} className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 hover:border-slate-600 hover:bg-slate-900 transition-all flex flex-col sm:flex-row items-start sm:items-center gap-5 group relative">
                                  <div className="h-20 w-20 rounded-xl bg-slate-950 relative overflow-hidden border border-slate-800 shrink-0 shadow-sm">
                                      <Image src={p.imageUrl || "/placeholder.svg"} alt="" fill className="object-cover"/>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <div className="flex justify-between">
                                        <h3 className="text-base font-bold text-white truncate group-hover:text-blue-400 transition-colors pr-8">{p.name}</h3>
                                        <div className="hidden sm:flex gap-1 absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={() => handleEditProduct(p)} className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-blue-400 hover:bg-blue-500/10 hover:border-blue-500 hover:text-white transition-all"><Edit size={16}/></button>
                                            <button onClick={() => handleDelete("products", p.id)} className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-red-400 hover:bg-red-500/10 hover:border-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                                        </div>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs">
                                          <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">S/ {p.price}</span>
                                          <span className="text-slate-400 flex items-center gap-1"><Box size={12}/> {p.stock} unid.</span>
                                          <span className="text-slate-500 uppercase tracking-wider text-[10px] border border-slate-800 px-1.5 rounded">{categories.find(c => c.id === p.categoryId)?.name || "Sin cat."}</span>
                                      </div>
                                  </div>
                                  <div className="flex sm:hidden gap-2 w-full mt-2">
                                      <button onClick={() => handleEditProduct(p)} className="flex-1 p-2 bg-slate-800 border border-slate-700 rounded-lg text-blue-400 flex justify-center"><Edit size={18}/></button>
                                      <button onClick={() => handleDelete("products", p.id)} className="flex-1 p-2 bg-slate-800 border border-slate-700 rounded-lg text-red-400 flex justify-center"><Trash2 size={18}/></button>
                                  </div>
                              </div>
                          ))
                      )}
                   </div>

                   {/* CONTROLES DE PAGINACIÓN */}
                   {filteredProducts.length > itemsPerPage && (
                       <div className="flex justify-center items-center gap-4 pt-4 border-t border-slate-800/50">
                           <button 
                             onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                             disabled={currentPage === 1}
                             className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 hover:text-white transition-colors"
                           >
                             <ChevronLeft size={20} />
                           </button>
                           <span className="text-sm font-medium text-slate-400">
                             Página <span className="text-white">{currentPage}</span> de <span className="text-white">{totalPages}</span>
                           </span>
                           <button 
                             onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                             disabled={currentPage === totalPages}
                             className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 hover:text-white transition-colors"
                           >
                             <ChevronRight size={20} />
                           </button>
                       </div>
                   )}
                </div>
            )}

            {/* VISTA: CATEGORÍAS */}
            {activeTab === "categories" && (
                <div className="space-y-8">
                   <div className="flex justify-between items-center pb-6 border-b border-slate-800/80">
                      <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">Categorías</h1>
                        <p className="text-slate-400 mt-1 text-sm">Organiza las secciones de la tienda.</p>
                      </div>
                      <button onClick={() => {setActiveTab("form-category"); resetForms()}} className="btn-primary"><Plus size={18} strokeWidth={3} /> Nueva</button>
                   </div>
                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                       {categories.map(c => (
                           <div key={c.id} className="bg-slate-900/80 rounded-3xl p-6 flex flex-col items-center text-center border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 hover:shadow-xl hover:shadow-blue-900/10 transition-all group relative">
                               <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all pt-1 pr-1 z-10">
                                   <button onClick={() => handleEditCategory(c)} className="p-1.5 bg-slate-800 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"><Edit size={14}/></button>
                                   <button onClick={() => handleDelete("categories", c.id)} className="p-1.5 bg-slate-800 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={14}/></button>
                               </div>
                               <div className="w-20 h-20 rounded-2xl bg-slate-950 border border-slate-800 mb-4 relative overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
                                   <Image src={c.imageUrl || "/placeholder.svg"} alt="" fill className="object-cover opacity-70 group-hover:opacity-100 transition-opacity"/>
                               </div>
                               <div className="text-3xl mb-2 drop-shadow-md">{c.icon}</div>
                               <div className="font-bold text-white">{c.name}</div>
                           </div>
                       ))}
                   </div>
                </div>
            )}

            {/* FORMULARIO PRODUCTO (Sin Cambios Mayores) */}
            {activeTab === "form-product" && (
                <div className="max-w-5xl mx-auto pb-20">
                    <div className="flex items-center gap-4 mb-8">
                        <button onClick={() => {setActiveTab("products"); resetForms()}} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all cursor-pointer"><ChevronLeft size={20}/></button>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">{editingId ? "Editar Producto" : "Crear Nuevo Producto"}</h2>
                            <p className="text-slate-400 text-sm">Rellena los detalles del artículo.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSaveProduct} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
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
                                            <ChevronLeft size={16} className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-500 pointer-events-none"/>
                                        </div>
                                    </div>
                                </div>
                            </div>
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

                        <div className="space-y-6">
                            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-6 border-b border-slate-800/80 pb-4">
                                    <div className="bg-purple-500/10 p-2 rounded-xl text-purple-500"><ImageIcon size={20}/></div>
                                    <h3 className="font-bold text-white text-lg">Imágenes</h3>
                                </div>
                                {(editingId && prodForm.images.length > 0 && prodFiles.length === 0) && (
                                    <div className="grid grid-cols-4 gap-2 mb-4">
                                        {prodForm.images.slice(0,4).map((img, i) => (
                                            <div key={i} className="aspect-square rounded-xl bg-slate-950 border border-slate-800 relative overflow-hidden"><Image src={img} alt="" fill className="object-cover"/></div>
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
                            <button disabled={uploading} className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
                                {uploading ? "Guardando..." : <><Save size={20}/> Guardar Producto</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* FORMULARIO CATEGORÍA (Sin Cambios Mayores) */}
            {activeTab === "form-category" && (
                <div className="max-w-4xl mx-auto pb-10 pt-6">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            <button onClick={() => {setActiveTab("categories"); resetForms()}} className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all cursor-pointer"><ChevronLeft size={20}/></button>
                            <div><h2 className="text-2xl font-black text-white">{editingId ? "Editar Categoría" : "Nueva Categoría"}</h2></div>
                        </div>
                    </div>
                    <form onSubmit={handleSaveCategory} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="bg-slate-900/80 border border-slate-800 rounded-[2rem] p-8 shadow-lg">
                                <h3 className="font-bold text-white mb-6 text-sm uppercase text-slate-400">Datos Generales</h3>
                                <div className="space-y-5">
                                    <div className="space-y-2"><label className="text-xs font-bold text-slate-400 uppercase ml-1">Nombre</label><input className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-blue-500 focus:ring-1 outline-none text-lg" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} placeholder="Ej: Deportes" required /></div>
                                    <div className="space-y-2"><label className="text-xs font-bold text-slate-400 uppercase ml-1">Icono</label><div className="flex gap-3"><div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-3xl shrink-0">{catForm.icon}</div><input className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl p-4 focus:border-blue-500 focus:ring-1 outline-none" value={catForm.icon} onChange={e => setCatForm({...catForm, icon: e.target.value})} placeholder="Emoji" required /></div></div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="bg-slate-900/80 border border-slate-800 rounded-[2rem] p-8 shadow-lg h-full flex flex-col">
                                <h3 className="font-bold text-white mb-6 text-sm uppercase text-slate-400">Imagen de Portada</h3>
                                <div className="flex-1 flex flex-col gap-4">
                                    <div className="relative w-full h-48 rounded-3xl bg-slate-950 border border-slate-800 overflow-hidden shadow-inner">
                                        {categoryPreviewUrl ? <Image src={categoryPreviewUrl} alt="Preview" fill className="object-cover" /> : <div className="flex items-center justify-center h-full text-slate-700"><ImageIcon size={48} strokeWidth={1.5} /></div>}
                                    </div>
                                    <label className="cursor-pointer group"><div className="w-full bg-slate-800 border-2 border-dashed border-slate-700 rounded-2xl p-4 flex items-center justify-center gap-3 hover:bg-slate-700 hover:border-emerald-500 transition-all"><Upload size={20} className="text-slate-400 group-hover:text-white"/><span className="text-slate-400 font-medium text-sm group-hover:text-white">{catFile ? "Cambiar imagen" : "Seleccionar imagen"}</span></div><input type="file" accept="image/*" className="hidden" onChange={e => e.target.files && setCatFile(e.target.files[0])} /></label>
                                </div>
                                <button disabled={uploading} className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg mt-6 cursor-pointer disabled:opacity-50 active:scale-95 flex justify-center gap-2">{uploading ? "Guardando..." : <><Save size={20}/> Guardar Categoría</>}</button>
                            </div>
                        </div>
                    </form>
                </div>
            )}
        </div>
      </main>

      <style jsx>{`
        .nav-btn { @apply w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer font-medium text-sm border; }
        .nav-btn.inactive { @apply bg-slate-800/50 text-slate-400 border-slate-800/50 hover:bg-slate-800 hover:text-white hover:border-slate-700; }
        .nav-btn.active { @apply bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/40; }
        .btn-primary { @apply flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95 text-sm cursor-pointer; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}