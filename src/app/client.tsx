'use client';

import { useChat } from 'ai/react';
import { useState } from 'react';

const prepopulatedQuestions = [];

export default function Chat() {
  const [isLoading, setIsLoading] = useState(false);
  const [fileList, setFiles] = useState<File[]>([]);

  const { messages, input, setInput, handleInputChange, handleSubmit } = useChat({
    onResponse(response) {
      
      setIsLoading(false);
    },
    headers: {},
    onFinish() {
      // pass
    }
  });

  const userFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setIsLoading(true);
    handleSubmit(e);
  };

  const handlePrepopulatedQuestion = (question: string) => {
    handleInputChange({
      target: {
        value: question,
      },
    } as React.ChangeEvent<HTMLInputElement>);

    setIsLoading(true);

    const customSubmitEvent = {
      preventDefault: () => { },
    } as unknown as React.FormEvent<HTMLFormElement>;

    handleSubmit(customSubmitEvent);
  };

  const handleFileChange = ({ target: {files} }: React.ChangeEvent<HTMLInputElement>) => {
    if (files && files.length) {
      setFiles(Array.from(files))
    }
  }
  
  const handleFileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(e.target, fileList);

    const upload = async () => {
      for (const file of fileList) {
        const data = Buffer.from(await file.arrayBuffer());//URL.createObjectURL(file)
        //console.log(data);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: JSON.stringify({ data: data, name: file.name }),
        });
        //console.log(response.json());
      }
    }
    upload();
  }

  return (
    <div className="w-4/5">
      <div className="mt-4 mb-8 px-6 text-xl">Welcome to AI Chat!</div>
      <div className="flex flex-col md:flex-row flex-1 w-full max-w-5xl mx-auto">
        <div className="flex-1 px-6">
          {messages.map((m) => (
            <div key={m.id} className="mb-4 whitespace-pre-wrap text-lg leading-relaxed">
              <span className={m.role === 'user' ? 'text-blue-700' : 'text-green-700'}>
                {m.role === 'user' ? 'You: ' : 'AI: '}
              </span>
              {m.content}
            </div>
          ))}
        </div>
      </div>
      <div>
        {isLoading && (<p className="px-6">Loading...</p>)}

        <form onSubmit={userFormSubmit} className="mt-4 mb-8 px-6">
          <input
            className="w-full p-2 border border-gray-300 rounded shadow-xl text-black"
            value={input}
            placeholder="Ask something..."
            onChange={handleInputChange}
          />
        </form>

        <form onSubmit={handleFileSubmit} className="mt-4 mb-8 px-6">
          <p>Upload File to Knowledge</p>
          <input
            type="file"
            onChange={handleFileChange}
          />
          <input
            type="submit"
            value="Upload"
            className="px-3 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-opacity-50"
          />
        </form>
        
        <div className="mt-4 px-6">
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {/*prepopulatedQuestions.map((question, index) => (
              <button
                key={index}
                className="px-3 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-opacity-50"
                onClick={() => handlePrepopulatedQuestion(question)}
              >
                {question}
              </button>
            ))*/}
          </div>
        </div>
      </div>
    </div>
  );
}