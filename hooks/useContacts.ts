import { useState, useEffect, useCallback } from 'react';
import { useSafeTraceStore } from '../store/safetraceStore';
import { Contact } from '../types';

export function useContacts() {
  const { contacts, setContacts } = useSafeTraceStore();
  const [isLoading, setIsLoading] = useState(false);

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/contacts');
      const data = await res.json();
      if (data && data.contacts) {
        setContacts(data.contacts);
      }
    } catch (e) {
      console.error('Failed to fetch contacts:', e);
    } finally {
      setIsLoading(false);
    }
  }, [setContacts]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const addContact = async (contact: Omit<Contact, 'id' | 'userId'>) => {
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact)
      });
      if (res.ok) {
        await fetchContacts();
        return true;
      }
    } catch (e) {
      console.error('Failed to add contact:', e);
    }
    return false;
  };

  const removeContact = async (id: string) => {
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchContacts();
        return true;
      }
    } catch (e) {
      console.error('Failed to remove contact:', e);
    }
    return false;
  };

  return { contacts, isLoading, fetchContacts, addContact, removeContact };
}
