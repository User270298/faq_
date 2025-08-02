#!/usr/bin/env python3
"""
Скрипт для управления FAQ через командную строку
Позволяет добавлять, редактировать и удалять вопросы без вмешательства в код
"""
import json
import sys
import os
from datetime import datetime
from typing import List, Dict, Optional

class FAQManager:
    def __init__(self, data_file: str = "data/faq.json"):
        self.data_file = data_file
        self.data = self._load_data()
    
    def _load_data(self) -> Dict:
        """Load FAQ data from JSON file"""
        try:
            with open(self.data_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"❌ Файл {self.data_file} не найден!")
            sys.exit(1)
        except json.JSONDecodeError as e:
            print(f"❌ Ошибка чтения JSON: {e}")
            sys.exit(1)
    
    def _save_data(self):
        """Save FAQ data to JSON file"""
        try:
            # Update metadata
            self.data["metadata"] = {
                "version": "1.0",
                "last_updated": datetime.now().strftime("%Y-%m-%d"),
                "total_questions": len(self.data["faq"]),
                "categories_count": len(self.data["categories"])
            }
            
            with open(self.data_file, 'w', encoding='utf-8') as f:
                json.dump(self.data, f, ensure_ascii=False, indent=2)
            print("✅ Данные сохранены успешно!")
        except Exception as e:
            print(f"❌ Ошибка сохранения: {e}")
    
    def list_questions(self, category: Optional[str] = None):
        """List all questions or by category"""
        questions = self.data["faq"]
        
        if category:
            questions = [q for q in questions if q["category"] == category]
            if not questions:
                print(f"❌ Вопросы в категории '{category}' не найдены")
                return
        
        print(f"\n📋 Список вопросов ({len(questions)}):")
        print("-" * 80)
        
        for q in questions:
            print(f"ID: {q['id']}")
            print(f"Вопрос: {q['question']}")
            print(f"Категория: {q['category']}")
            print(f"Приоритет: {q.get('priority', 'Не задан')}")
            print(f"Ключевые слова: {', '.join(q['keywords'])}")
            print("-" * 80)
    
    def add_question(self):
        """Add new question interactively"""
        print("\n➕ Добавление нового вопроса")
        print("-" * 40)
        
        # Get question details
        question = input("Введите вопрос: ").strip()
        if not question:
            print("❌ Вопрос не может быть пустым!")
            return
        
        answer = input("Введите ответ: ").strip()
        if not answer:
            print("❌ Ответ не может быть пустым!")
            return
        
        # Show available categories
        print("\nДоступные категории:")
        for key, value in self.data["categories"].items():
            print(f"  {key}: {value}")
        
        category = input("Введите категорию: ").strip()
        if category not in self.data["categories"]:
            print("❌ Неверная категория!")
            return
        
        keywords_input = input("Введите ключевые слова (через запятую): ").strip()
        keywords = [kw.strip() for kw in keywords_input.split(",") if kw.strip()]
        
        priority_input = input("Введите приоритет (число, Enter для пропуска): ").strip()
        priority = int(priority_input) if priority_input.isdigit() else len(self.data["faq"]) + 1
        
        # Generate new ID
        new_id = max([q["id"] for q in self.data["faq"]]) + 1 if self.data["faq"] else 1
        
        # Create new question
        new_question = {
            "id": new_id,
            "question": question,
            "answer": answer,
            "keywords": keywords,
            "category": category,
            "priority": priority,
            "created_at": datetime.now().strftime("%Y-%m-%d"),
            "updated_at": datetime.now().strftime("%Y-%m-%d")
        }
        
        self.data["faq"].append(new_question)
        self._save_data()
        print(f"✅ Вопрос добавлен с ID: {new_id}")
    
    def edit_question(self, question_id: int):
        """Edit existing question"""
        question = next((q for q in self.data["faq"] if q["id"] == question_id), None)
        if not question:
            print(f"❌ Вопрос с ID {question_id} не найден!")
            return
        
        print(f"\n✏️ Редактирование вопроса ID: {question_id}")
        print("-" * 40)
        print(f"Текущий вопрос: {question['question']}")
        
        # Get new values
        new_question = input("Новый вопрос (Enter для пропуска): ").strip()
        if new_question:
            question["question"] = new_question
        
        new_answer = input("Новый ответ (Enter для пропуска): ").strip()
        if new_answer:
            question["answer"] = new_answer
        
        # Show categories
        print("\nДоступные категории:")
        for key, value in self.data["categories"].items():
            print(f"  {key}: {value}")
        
        new_category = input("Новая категория (Enter для пропуска): ").strip()
        if new_category:
            if new_category not in self.data["categories"]:
                print("❌ Неверная категория!")
                return
            question["category"] = new_category
        
        new_keywords = input("Новые ключевые слова (через запятую, Enter для пропуска): ").strip()
        if new_keywords:
            question["keywords"] = [kw.strip() for kw in new_keywords.split(",") if kw.strip()]
        
        new_priority = input("Новый приоритет (число, Enter для пропуска): ").strip()
        if new_priority.isdigit():
            question["priority"] = int(new_priority)
        
        question["updated_at"] = datetime.now().strftime("%Y-%m-%d")
        self._save_data()
        print("✅ Вопрос обновлен!")
    
    def delete_question(self, question_id: int):
        """Delete question"""
        question = next((q for q in self.data["faq"] if q["id"] == question_id), None)
        if not question:
            print(f"❌ Вопрос с ID {question_id} не найден!")
            return
        
        print(f"\n🗑️ Удаление вопроса ID: {question_id}")
        print(f"Вопрос: {question['question']}")
        
        confirm = input("Вы уверены? (y/N): ").strip().lower()
        if confirm == 'y':
            self.data["faq"] = [q for q in self.data["faq"] if q["id"] != question_id]
            self._save_data()
            print("✅ Вопрос удален!")
        else:
            print("❌ Удаление отменено")
    
    def show_stats(self):
        """Show FAQ statistics"""
        questions = self.data["faq"]
        
        print("\n📊 Статистика FAQ")
        print("-" * 40)
        print(f"Всего вопросов: {len(questions)}")
        
        # Count by category
        category_count = {}
        for q in questions:
            category = q["category"]
            category_count[category] = category_count.get(category, 0) + 1
        
        print("\nПо категориям:")
        for category, count in category_count.items():
            category_name = self.data["categories"].get(category, category)
            print(f"  {category_name}: {count}")
        
        # Popular keywords
        all_keywords = []
        for q in questions:
            all_keywords.extend(q["keywords"])
        
        keyword_count = {}
        for keyword in all_keywords:
            keyword_count[keyword] = keyword_count.get(keyword, 0) + 1
        
        popular_keywords = sorted(keyword_count.items(), key=lambda x: x[1], reverse=True)[:5]
        
        print("\nПопулярные ключевые слова:")
        for keyword, count in popular_keywords:
            print(f"  {keyword}: {count}")

def main():
    if len(sys.argv) < 2:
        print("""
🔧 FAQ Manager - Управление часто задаваемыми вопросами

Использование:
  python faq_manager.py <команда> [параметры]

Команды:
  list [категория]     - Показать все вопросы или по категории
  add                  - Добавить новый вопрос
  edit <id>           - Редактировать вопрос по ID
  delete <id>         - Удалить вопрос по ID
  stats               - Показать статистику
  help                - Показать эту справку

Примеры:
  python faq_manager.py list
  python faq_manager.py list pricing
  python faq_manager.py add
  python faq_manager.py edit 1
  python faq_manager.py delete 1
  python faq_manager.py stats
        """)
        return
    
    manager = FAQManager()
    command = sys.argv[1].lower()
    
    if command == "list":
        category = sys.argv[2] if len(sys.argv) > 2 else None
        manager.list_questions(category)
    
    elif command == "add":
        manager.add_question()
    
    elif command == "edit":
        if len(sys.argv) < 3:
            print("❌ Укажите ID вопроса для редактирования!")
            return
        try:
            question_id = int(sys.argv[2])
            manager.edit_question(question_id)
        except ValueError:
            print("❌ ID должен быть числом!")
    
    elif command == "delete":
        if len(sys.argv) < 3:
            print("❌ Укажите ID вопроса для удаления!")
            return
        try:
            question_id = int(sys.argv[2])
            manager.delete_question(question_id)
        except ValueError:
            print("❌ ID должен быть числом!")
    
    elif command == "stats":
        manager.show_stats()
    
    elif command == "help":
        main()
    
    else:
        print(f"❌ Неизвестная команда: {command}")
        print("Используйте 'python faq_manager.py help' для справки")

if __name__ == "__main__":
    main() 