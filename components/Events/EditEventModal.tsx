import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPasswordVerified: () => void;
  eventId: string;
}

export default function EditEventModal({ isOpen, onClose, onPasswordVerified: onPasswordSuccess, eventId }: EditEventModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data: event, error: fetchError } = await supabase
        .from("events")
        .select("password")
        .eq("id", eventId)
        .single();

      if (fetchError) {
        console.error('Fetch Error:', fetchError);
        throw new Error('Failed to fetch event');
      }

      if (!event) {
        throw new Error('Event not found');
      }

      if (event.password === password) {
        onPasswordSuccess();
        onClose();
      } else {
        setError("Incorrect password");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to verify password");
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[600] flex items-center justify-center">
      <div className="bg-zinc-900 rounded-lg p-6 w-[90%] max-w-md">
        <h2 className="text-lg font-semibold text-white mb-4">Verify Event Password</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Enter event password"
              required
            />
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
