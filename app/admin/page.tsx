"use client"
import { useState, useEffect } from "react";
import { auth, db, storage, Product, Category } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { LogOut, Plus, Trash2, Package, Grid, LayoutDashboard, Upload, X, Save } from "lucide-react";
import Image from "next/image";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"products" | "categories" | "create-product" | "create-category">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState(false);

  // --- ESTADOS PRODUCTO ---
  const [prodForm, setProdForm] = useState({ 
      name: "", price: "", originalPrice: "", description: "", categoryId: "", stock: "10" 
  });
  const [prodFiles, setProdFiles] = useState<File[]>([]);
  const [prodSpecs, setProdSpecs] = useState<{key: string, value: string}[]>([]);
  const [specInput, setSpecInput] = useState({ key: "", value: "" });

  // --- ESTADOS CATEGORÍA ---
  const [catForm, setCatForm] = useState({ name: "", icon: "🎁" });
  const [catFile, setCatFile] = useState<File | null>(null);

  const fetchData = async () => {
    const pSnap = await getDocs(collection(db, "products"));
    const cSnap = await getDocs(collection(db, "categories"));
    setProducts(pSnap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    setCategories(cSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
  };

  useEffect(() => { fetchData(); }, []);

  const uploadFile = async (file: File, path: string) => {
    const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  // --- LÓGICA MEJORADA PARA CREAR PRODUCTO ---
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.categoryId) return alert("Selecciona categoría");
    if (prodFiles.length === 0) return alert("Sube al menos una imagen");

    setUploading(true);
    try {
      // 1. Subir imágenes
      const uploadPromises = prodFiles.map(file => uploadFile(file, "products"));
      const imageUrls = await Promise.all(uploadPromises);

      // 2. Procesar especificaciones (CORRECCIÓN: Agregar la pendiente si existe)
      const finalSpecs = [...prodSpecs];
      if (specInput.key && specInput.value) {
         finalSpecs.push(specInput); // Auto-agregar si el usuario olvidó darle al "+"
      }
      
      const specsObject: Record<string, string> = {};
      finalSpecs.forEach(s => specsObject[s.key] = s.value);

      const selectedCat = categories.find(c => c.id === prodForm.categoryId);

      // 3. Guardar
      await addDoc(collection(db, "products"), {
        name: prodForm.name,
        price: parseFloat(prodForm.price),
        originalPrice: parseFloat(prodForm.originalPrice) || (parseFloat(prodForm.price) * 1.2),
        description: prodForm.description,
        imageUrl: imageUrls[0],
        images: imageUrls,
        categoryId: prodForm.categoryId,
        categorySlug: selectedCat?.slug || "varios",
        stock: parseInt(prodForm.stock),
        specifications: specsObject,
        createdAt: serverTimestamp()
      });

      alert("¡Producto guardado exitosamente!");
      // Resetear
      setProdForm({ name: "", price: "", originalPrice: "", description: "", categoryId: "", stock: "10" });
      setProdFiles([]);
      setProdSpecs([]);
      setSpecInput({ key: "", value: "" });
      setActiveTab("products");
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Error al guardar.");
    }
    setUploading(false);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catFile) return alert("Sube imagen de categoría");
    setUploading(true);
    try {
        const url = await uploadFile(catFile, "categories");
        const slug = catForm.name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
        await addDoc(collection(db, "categories"), {
            name: catForm.name, slug: slug, imageUrl: url, icon: catForm.icon, createdAt: serverTimestamp()
        });
        alert("Categoría creada!");
        setCatForm({ name: "", icon: "🎁" }); setCatFile(null); setActiveTab("categories"); fetchData();
    } catch (e) { console.error(e); alert("Error"); }
    setUploading(false);
  }

  const handleDelete = async (col: string, id: string) => {
    if(confirm("¿Eliminar permanentemente?")) { await deleteDoc(doc(db, col, id)); fetchData(); }
  };

  // Helper para agregar spec manualmente
  const addSpec = (e: React.MouseEvent) => {
    e.preventDefault(); // Evitar submit del form
    if(specInput.key && specInput.value) {
      setProdSpecs([...prodSpecs, specInput]);
      setSpecInput({ key: "", value: "" });
    }
  };

  const removeSpec = (index: number) => {
     const newSpecs = [...prodSpecs];
     newSpecs.splice(index, 1);
     setProdSpecs(newSpecs);
  }

  return (
    <div className="flex min-h-screen bg-slate-100 font-sans text-slate-900">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl fixed h-full z-20">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold flex items-center gap-2"><LayoutDashboard className="text-red-500" /> Admin</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Gestión</p>
            <button onClick={() => setActiveTab("products")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === "products" ? "bg-red-600 text-white" : "text-slate-400 hover:bg-slate-800"}`}><Package size={20} /> Productos</button>
            <button onClick={() => setActiveTab("categories")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === "categories" ? "bg-red-600 text-white" : "text-slate-400 hover:bg-slate-800"}`}><Grid size={20} /> Categorías</button>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-6 mb-2">Crear Nuevo</p>
            <button onClick={() => setActiveTab("create-product")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === "create-product" ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800"}`}><Plus size={20} /> Producto</button>
            <button onClick={() => setActiveTab("create-category")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === "create-category" ? "bg-emerald-600 text-white" : "text-slate-400 hover:bg-slate-800"}`}><Plus size={20} /> Categoría</button>
        </nav>
        <div className="p-4 border-t border-slate-800">
            <button onClick={() => signOut(auth)} className="w-full flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-red-400 transition"><LogOut size={18} /> Salir</button>
        </div>
      </aside>

      {/* CONTENIDO */}
      <main className="flex-1 ml-64 p-8 bg-slate-100 min-h-screen">
        
        {/* LISTA PRODUCTOS */}
        {activeTab === "products" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-800">Inventario</h2>
                <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-500">{products.length} items</span>
             </div>
             <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
                    <tr><th className="p-4">Producto</th><th className="p-4">Precio</th><th className="p-4">Stock</th><th className="p-4 text-right">Acción</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {products.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50 transition">
                            <td className="p-4 flex items-center gap-3">
                                <div className="h-10 w-10 rounded bg-slate-100 overflow-hidden relative border border-slate-200">
                                    <Image src={p.imageUrl || "/placeholder.svg"} alt={p.name} fill className="object-cover" />
                                </div>
                                <span className="font-medium text-slate-700">{p.name}</span>
                            </td>
                            <td className="p-4 text-slate-600">S/ {p.price}</td>
                            <td className="p-4 text-slate-600">{p.stock}</td>
                            <td className="p-4 text-right">
                                <button onClick={() => handleDelete("products", p.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"><Trash2 size={18} /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
          </div>
        )}

        {/* LISTA CATEGORÍAS */}
        {activeTab === "categories" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {categories.map(c => (
                    <div key={c.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center relative group hover:shadow-md transition">
                        <button onClick={() => handleDelete("categories", c.id)} className="absolute top-2 right-2 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 size={18} /></button>
                        <div className="h-16 w-16 rounded-full bg-slate-50 relative overflow-hidden mb-3 border border-slate-100">
                            <Image src={c.imageUrl || "/placeholder.svg"} alt={c.name} fill className="object-cover" />
                        </div>
                        <div className="text-2xl mb-1">{c.icon}</div>
                        <h3 className="font-bold text-slate-800">{c.name}</h3>
                    </div>
                ))}
            </div>
        )}

        {/* FORMULARIO PRODUCTO */}
        {activeTab === "create-product" && (
            <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-800">Nuevo Producto</h2>
                </div>
                <form onSubmit={handleCreateProduct} className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Nombre</label>
                            <input className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500" value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} required placeholder="Ej: Auto RC" />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Precio Oferta</label>
                                <input type="number" className="w-full border border-slate-300 rounded-lg p-3 text-red-600 font-bold outline-none focus:border-blue-500" value={prodForm.price} onChange={e => setProdForm({...prodForm, price: e.target.value})} required placeholder="150" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-1">Precio Tachado</label>
                                <input type="number" className="w-full border border-slate-300 rounded-lg p-3 text-slate-500 bg-slate-50 outline-none focus:border-blue-500" value={prodForm.originalPrice} onChange={e => setProdForm({...prodForm, originalPrice: e.target.value})} placeholder="200" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Stock</label>
                                <input type="number" className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500" value={prodForm.stock} onChange={e => setProdForm({...prodForm, stock: e.target.value})} required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Categoría</label>
                            <select className="w-full border border-slate-300 rounded-lg p-3 bg-white outline-none focus:border-blue-500" value={prodForm.categoryId} onChange={e => setProdForm({...prodForm, categoryId: e.target.value})} required>
                                <option value="">-- Seleccionar --</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Descripción</label>
                            <textarea rows={4} className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-blue-500" value={prodForm.description} onChange={e => setProdForm({...prodForm, description: e.target.value})} required />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                            <label className="block text-sm font-bold text-slate-700 mb-3">Galería</label>
                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center relative hover:bg-white transition group bg-white/50">
                                <input type="file" multiple accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => e.target.files && setProdFiles(Array.from(e.target.files))} />
                                <div className="flex flex-col items-center text-slate-400 group-hover:text-blue-500">
                                    <Upload className="h-8 w-8 mb-2" />
                                    <p className="text-xs font-medium">Clic o arrastra fotos</p>
                                </div>
                            </div>
                            {prodFiles.length > 0 && (
                                <div className="mt-4 grid grid-cols-3 gap-2">
                                    {prodFiles.map((file, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                                            <Image src={URL.createObjectURL(file)} alt="preview" fill className="object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                             <h3 className="font-bold text-sm text-slate-700 mb-3">Especificaciones</h3>
                             <div className="flex gap-2 mb-2">
                                <input placeholder="Ej: Batería" className="flex-1 border p-2 rounded text-sm" value={specInput.key} onChange={e => setSpecInput({...specInput, key: e.target.value})} />
                                <input placeholder="Ej: 5000mAh" className="flex-1 border p-2 rounded text-sm" value={specInput.value} onChange={e => setSpecInput({...specInput, value: e.target.value})} />
                                <button type="button" onClick={addSpec} className="bg-slate-800 text-white p-2 rounded hover:bg-slate-700"><Plus size={16} /></button>
                             </div>
                             <div className="space-y-1">
                                {prodSpecs.map((s, i) => (
                                    <div key={i} className="flex justify-between text-xs bg-white p-2 rounded border border-slate-200 text-slate-600 items-center">
                                        <span><b>{s.key}:</b> {s.value}</span>
                                        <button type="button" onClick={() => removeSpec(i)} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                                    </div>
                                ))}
                             </div>
                        </div>

                        <button disabled={uploading} type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition disabled:opacity-50 flex justify-center gap-2">
                            {uploading ? "Subiendo..." : <><Save size={20}/> Guardar Producto</>}
                        </button>
                    </div>
                </form>
            </div>
        )}

        {/* FORMULARIO CATEGORÍA */}
        {activeTab === "create-category" && (
            <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-800">Nueva Categoría</h2>
                </div>
                <form onSubmit={handleCreateCategory} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Nombre</label>
                        <input className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-emerald-500" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Icono</label>
                        <input className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-emerald-500" value={catForm.icon} onChange={e => setCatForm({...catForm, icon: e.target.value})} required placeholder="Ej: 🧸" />
                    </div>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center relative bg-slate-50 hover:bg-white transition">
                        <input type="file" accept="image/*" onChange={e => e.target.files && setCatFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        <div className="text-sm text-slate-500">{catFile ? <span className="text-emerald-600 font-bold">{catFile.name}</span> : "Subir Portada"}</div>
                    </div>
                    {catFile && <div className="relative w-full h-32 rounded-lg overflow-hidden border border-slate-200"><Image src={URL.createObjectURL(catFile)} alt="prev" fill className="object-cover" /></div>}
                    <button disabled={uploading} type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition disabled:opacity-50">
                        {uploading ? "Guardando..." : "Crear Categoría"}
                    </button>
                </form>
            </div>
        )}
      </main>
    </div>
  );
}