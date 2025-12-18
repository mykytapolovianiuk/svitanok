import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2 } from 'lucide-react';

interface AttributeRow {
  key: string;
  value: string;
}

interface AttributeEditorProps {
  value: Record<string, any>;
  onChange: (attributes: Record<string, any>) => void;
}

export default function AttributeEditor({ value, onChange }: AttributeEditorProps) {
  // Convert object to array format for editing
  const objectToArray = (obj: Record<string, any>): AttributeRow[] => {
    if (!obj) return [{ key: '', value: '' }];
    return Object.entries(obj).map(([key, value]) => ({
      key,
      value: String(value)
    }));
  };

  // Convert array format back to object
  const arrayToObject = (arr: AttributeRow[]): Record<string, any> => {
    const obj: Record<string, any> = {};
    arr.forEach(({ key, value }) => {
      if (key.trim() !== '') {
        obj[key] = value;
      }
    });
    return obj;
  };

  const [attributes, setAttributes] = useState<AttributeRow[]>(objectToArray(value));
  const [attributeKeys, setAttributeKeys] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch all existing attribute keys from the database
  useEffect(() => {
    const fetchAttributeKeys = async () => {
      try {
        // Get all unique attribute keys from products
        const { data, error } = await supabase.rpc('get_unique_attribute_keys');
        
        if (error) {
          console.error('Error fetching attribute keys:', error);
          // Fallback to fetching from existing products if RPC fails
          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('attributes');
          
          if (!productsError && productsData) {
            const keys = new Set<string>();
            productsData.forEach(product => {
              if (product.attributes) {
                Object.keys(product.attributes).forEach(key => keys.add(key));
              }
            });
            setAttributeKeys(Array.from(keys).sort());
          }
        } else {
          setAttributeKeys(data || []);
        }
      } catch (err) {
        console.error('Error fetching attribute keys:', err);
      }
    };

    fetchAttributeKeys();
  }, []);

  // Update parent when attributes change
  useEffect(() => {
    const newObj = arrayToObject(attributes);
    onChange(newObj);
  }, [attributes]);

  const handleAddRow = () => {
    setAttributes([...attributes, { key: '', value: '' }]);
  };

  const handleRemoveRow = (index: number) => {
    if (attributes.length <= 1) {
      setAttributes([{ key: '', value: '' }]);
      return;
    }
    
    const newAttributes = [...attributes];
    newAttributes.splice(index, 1);
    setAttributes(newAttributes);
  };

  const handleChange = (index: number, field: 'key' | 'value', newValue: string) => {
    const newAttributes = [...attributes];
    newAttributes[index][field] = newValue;
    
    // Validation
    const keys = newAttributes.map(attr => attr.key).filter(key => key.trim() !== '');
    const uniqueKeys = new Set(keys);
    
    if (keys.length !== uniqueKeys.size) {
      setError('Ключі атрибутів повинні бути унікальними');
    } else {
      setError(null);
    }
    
    setAttributes(newAttributes);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {attributes.map((attr, index) => (
          <div key={index} className="flex gap-2 items-start">
            <div className="flex-1">
              <input
                type="text"
                value={attr.key}
                onChange={(e) => handleChange(index, 'key', e.target.value)}
                list={`attribute-keys-${index}`}
                placeholder="Назва атрибута"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              {attributeKeys.length > 0 && (
                <datalist id={`attribute-keys-${index}`}>
                  {attributeKeys.map((key) => (
                    <option key={key} value={key} />
                  ))}
                </datalist>
              )}
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={attr.value}
                onChange={(e) => handleChange(index, 'value', e.target.value)}
                placeholder="Значення"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={() => handleRemoveRow(index)}
              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Видалити атрибут"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
      
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}
      
      <button
        type="button"
        onClick={handleAddRow}
        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-colors"
      >
        <Plus size={16} className="mr-1" />
        Додати атрибут
      </button>
    </div>
  );
}