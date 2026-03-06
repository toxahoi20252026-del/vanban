
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Upload,
  ChevronRight,
  FileType,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  FileText,
  Key as KeyIcon,
  Eye,
  EyeOff,
  Download,
  Loader2,
  Zap,
  Table as TableIcon,
  Pen,
  Sparkles,
  Flower2,
  AlertTriangle,
  CheckCircle2,
  Info,
  Hash,
  Award,
  FileDown,
  Lightbulb,
  MessageSquareWarning,
  CheckCircle,
  FileSearch,
  BookMarked,
  History as HistoryIcon,
  Trash2,
  Clock,
  Copy,
  Check,
  Languages,
  ArrowRightLeft,
  Quote,
  Target,
  ListTodo,
  Tag,
  Sheet,
  Medal,
  Type,
  Layout,
  ImageIcon,
  Search,
  LayoutDashboard,
  Layers,
  Star,
  Library,
  Milestone,
  ClipboardList,
  FileSignature,
  Bookmark,
  Users,
  BookType,
  LibraryBig,
  FilePenLine,
  School,
  Activity,
  Database,
  BookOpenCheck,
  CloudUpload,
  Cpu,
  CalendarDays,
  BookmarkPlus,
  X,
  FlipHorizontal,
  Mic,
  MicOff,
  RefreshCw,
  SearchCheck,
  FileCheck2,
  ShieldAlert,
  Menu
} from 'lucide-react';
import * as mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, VerticalAlign, AlignmentType, BorderStyle, UnderlineType } from 'docx';
import saveAs from 'file-saver';
import * as XLSX from 'xlsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as diff from 'diff';
import { analyzeContent } from './geminiService';
import { AppStatus, HistoryItem, InitiativeApplication, LogicCheckResult, OriginalityReport } from './types';
import { Button, Card, ErrorBanner } from './components/UI';

const REWRITE_STYLES = [
  { id: 'academic', label: 'Hàn lâm', icon: <BookOpen className="w-3 h-3" />, desc: "Hàn lâm" },
  { id: 'creative', label: 'Sáng tạo', icon: <Sparkles className="w-3 h-3" />, desc: "Sáng tạo" },
  { id: 'concise', label: 'Súc tích', icon: <Zap className="w-3 h-3" />, desc: "Súc tích" },
  { id: 'persuasive', label: 'Thuyết phục', icon: <Target className="w-3 h-3" />, desc: "Thuyết phục" },
  { id: 'skkn', label: 'Sáng kiến', icon: <Award className="w-3 h-3" />, desc: "Sáng kiến kinh nghiệm" },
];

const AI_MODELS = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Mặc định mới)' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Ổn định)' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Nâng cao)' },
  { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite' },
];

const SUMMARY_LEVELS = [
  { id: 'flashcard', label: 'Sơ lược', icon: <Layers className="w-3 h-3" /> },
  { id: 'standard', label: 'Tiêu chuẩn', icon: <FileText className="w-3 h-3" /> },
  { id: 'deepdive', label: 'Chuyên sâu', icon: <BookMarked className="w-3 h-3" /> },
];

const SUBJECTS = [
  "Toán học", "Ngữ văn", "Tiếng Anh", "Khoa học tự nhiên",
  "Lịch sử và Địa lý", "GDCD", "Tin học", "Công nghệ",
  "Giáo dục thể chất", "Nghệ thuật (Âm nhạc, Mỹ thuật)"
];

const TEXTBOOKS = [
  "Kết nối tri thức",
  "Chân trời sáng tạo",
  "Cánh diều"
];

const CLASSES = [
  "6/1", "6/2", "6/3",
  "7/1", "7/2", "7/3",
  "8/1", "8/2", "8/3",
  "9/1", "9/2", "9/3"
];

const YEARS = [
  "2025-2026",
  "2026-2027",
  "2027-2028",
  "2028-2029",
  "2029-2030"
];

const EduLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <div className="bg-white p-2.5 rounded-2xl shadow-lg shadow-blue-100/50 border border-slate-50">
    <div className={`relative ${className}`}>
      <BookOpen className="w-full h-full text-blue-600" strokeWidth={2} />
      <Pen className="absolute -top-1 -right-1 w-1/2 h-1/2 text-pink-500" strokeWidth={3} />
    </div>
  </div>
);

const PeachBlossom = ({ className = "w-4 h-4" }: { className?: string }) => (
  <Flower2 className={`${className} text-pink-400`} />
);

const ApricotBlossom = ({ className = "w-4 h-4" }: { className?: string }) => (
  <Flower2 className={`${className} text-yellow-500`} />
);

const DiffView: React.FC<{ oldText: string, newText: string }> = ({ oldText, newText }) => {
  const diffs = diff.diffWords(oldText, newText);

  return (
    <div className="font-serif text-[18px] leading-[1.8] whitespace-pre-wrap p-6 bg-slate-50 rounded-2xl border border-slate-100">
      {diffs.map((part, index) => (
        <span
          key={index}
          className={
            part.added ? 'bg-emerald-100 text-emerald-800 px-1 rounded' :
              part.removed ? 'bg-red-100 text-red-800 line-through px-1 rounded' :
                ''
          }
        >
          {part.value}
        </span>
      ))}
    </div>
  );
};

const PRESETS = [
  { id: 'ocr', label: 'TRÍCH XUẤT', icon: <FileType className="w-4 h-4" />, prompt: "Trích xuất toàn bộ văn bản từ tài liệu này, giữ nguyên cấu trúc tiêu đề và bảng biểu nếu có." },
  { id: 'spellcheck', label: 'SOÁT', icon: <GraduationCap className="w-4 h-4" />, prompt: "Soát lỗi chuyên sâu 5 trụ cột: Dấu câu, Ngữ pháp, Chính tả, Dùng từ và Đánh máy với tư cách Giáo sư ngôn ngữ đầu ngành." },
  { id: 'rewrite', label: 'VIẾT', icon: <Sparkles className="w-4 h-4" />, prompt: "Hãy viết lại văn bản này một cách xuất sắc hơn, nâng tầm ngôn từ nhưng vẫn giữ nguyên ý chính." },
  { id: 'summary', label: 'TÓM', icon: <FileText className="w-4 h-4" />, prompt: "Hãy tóm tắt những ý cốt lõi nhất của tài liệu này." },
];

const App: React.FC = () => {
  const [fileData, setFileData] = useState<{ base64: string, mimeType: string, name: string, rawText?: string } | null>(null);
  const [inputText, setInputText] = useState(PRESETS[1].prompt);
  const [activePreset, setActivePreset] = useState(PRESETS[1].id);
  const [rewriteStyle, setRewriteStyle] = useState('academic');
  const [summaryLevel, setSummaryLevel] = useState('standard');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [rawOutput, setRawOutput] = useState('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [loadingText, setLoadingText] = useState("HỆ THỐNG ĐANG TRÍCH XUẤT TRI THỨC...");
  const [error, setError] = useState<string | null>(null);
  const [userKey, setUserKey] = useState<string>('');
  const [showKey, setShowKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [copied, setCopied] = useState(false);

  // New States for enhanced features
  const [isRecording, setIsRecording] = useState(false);
  const [logicCheckResult, setLogicCheckResult] = useState<LogicCheckResult | null>(null);
  const [originalityReport, setOriginalityReport] = useState<OriginalityReport | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [isProcessingLogic, setIsProcessingLogic] = useState(false);
  const [isProcessingOriginality, setIsProcessingOriginality] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // SKKN Form State - 2026 Administrative Format
  const [skknStep, setSkknStep] = useState(1);
  const [skknData, setSkknData] = useState<InitiativeApplication>({
    authorName: '',
    authorDOB: '',
    authorWorkplace: '',
    authorTitle: '',
    authorLevel: '',
    authorContribution: '100',
    initiativeName: '',
    applicationField: '',
    firstAppliedDate: '',
    investor: '',
    currentState: '',
    purpose: '',
    solution1: '',
    solution2: '',
    solution3: '',
    applicability: '',
    benefits: '',
    conditions: '',
    confidentialInfo: '',
    participants: []
  });
  const skknFileInputRef = useRef<HTMLInputElement>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [tableGenerated, setTableGenerated] = useState(false);
  const [reviewGenerated, setReviewGenerated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('VISION_SCRIPT_KEY');
    if (savedKey) {
      setUserKey(savedKey);
      setKeySaved(true);
    }
    const savedHistory = localStorage.getItem('VISION_SCRIPT_HISTORY');
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch (e) { }
    }
  }, []);

  const saveKey = () => {
    localStorage.setItem('VISION_SCRIPT_KEY', userKey);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  const handleFile = async (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    const isWord = file.name.endsWith('.docx') || file.name.endsWith('.doc');

    if (!isImage && !isPdf && !isWord) {
      setError("Chỉ hỗ trợ Ảnh, PDF, Word.");
      return;
    }

    try {
      if (isWord) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setFileData({
          base64: `data:text/plain;base64,${btoa(unescape(encodeURIComponent(result.value)))}`,
          mimeType: 'text/plain',
          name: file.name,
          rawText: result.value
        });
      } else {
        const reader = new FileReader();
        reader.onloadend = () => setFileData({ base64: reader.result as string, mimeType: file.type, name: file.name });
        reader.readAsDataURL(file);
      }
      setError(null);
      setRawOutput('');
      setStatus(AppStatus.IDLE);
    } catch (err) { setError("Lỗi đọc tệp."); }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          setStatus(AppStatus.LOADING);
          try {
            const result = await analyzeContent(
              "",
              "audio/webm",
              "Hãy chuyển đổi phiên thảo luận này thành bản nháp sáng kiến.",
              (chunk) => setRawOutput(chunk),
              "audio_to_draft",
              userKey,
              "skkn",
              "standard",
              { data: base64Audio, mimeType: 'audio/webm' },
              selectedModel
            );

            // Parse the draft and fill the form (simplified)
            setSkknData(prev => ({
              ...prev,
              initiativeName: result.match(/Tên sáng kiến:?\s*(.*)/i)?.[1] || prev.initiativeName,
              currentState: result.match(/Tình trạng:?\s*([\s\S]*?)(?=Giải pháp|$)/i)?.[1]?.trim() || prev.currentState,
              solution1: result.match(/Giải pháp:?\s*([\s\S]*?)(?=Hiệu quả|$)/i)?.[1]?.trim() || prev.solution1,
              benefits: result.match(/Hiệu quả:?\s*([\s\S]*?)$/i)?.[1]?.trim() || prev.benefits,
            }));

            setStatus(AppStatus.SUCCESS);
            setSkknStep(3); // Go to solutions step
          } catch (err: any) {
            setError(err.message || "Lỗi xử lý âm thanh.");
            setStatus(AppStatus.ERROR);
          }
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError("Không thể truy cập microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleLogicCheck = async () => {
    setIsProcessingLogic(true);
    try {
      const prompt = `
        Hãy kiểm tra tính nhất quán logic giữa hiện trạng và giải pháp:
        Hiện trạng: ${skknData.currentState}
        Giải pháp 1: ${skknData.solution1}
        Giải pháp 2: ${skknData.solution2}
        Giải pháp 3: ${skknData.solution3}
      `;
      const result = await analyzeContent("", "text/plain", prompt, undefined, "logic_check", userKey, undefined, undefined, undefined, selectedModel);
      setLogicCheckResult(JSON.parse(result));
    } catch (err) {
      setError("Lỗi kiểm tra logic.");
    } finally {
      setIsProcessingLogic(false);
    }
  };

  const handleOriginalityCheck = async () => {
    setIsProcessingOriginality(true);
    try {
      const textToCheck = parsedData.rewriteText || rawOutput || skknData.solution1 + skknData.solution2;
      const result = await analyzeContent("", "text/plain", textToCheck, undefined, "originality_check", userKey, undefined, undefined, undefined, selectedModel);
      setOriginalityReport(JSON.parse(result));
    } catch (err) {
      setError("Lỗi kiểm tra nguyên bản.");
    } finally {
      setIsProcessingOriginality(false);
    }
  };

  const exportToDocx = async (content: string, title: string, isSpellcheck = false, tableRows: string[][] = [], reportData: any = null) => {
    let sections = [];

    if (activePreset === 'rewrite' && rewriteStyle === 'skkn') {
      // Clean content from redundant headers added by AI
      let cleanedContent = content;
      const headerPatterns = [
        /CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM/i,
        /Độc lập[\s\-\–]+Tự do[\s\-\–]+Hạnh phúc/i,
        /Phú Quốc, ngày \d+ tháng \d+ năm \d+/i,
        /ĐƠN YÊU CẦU CÔNG NHẬN SÁNG KIẾN/i,
        /^\s*\*.*\d+.*\d+.*\*$/i, // Italicized date lines with '*'
        /^\s*\*.*SÁNG KIẾN.*\*$/i,   // Italicized title lines with '*'
        /^\s*\*.*CỘNG HÒA XÃ HỘI.*\*$/i // Italicized header lines with '*'
      ];

      const lines = cleanedContent.split('\n');
      let linesToSkip = 0;
      for (let j = 0; j < Math.min(lines.length, 15); j++) {
        const line = lines[j].trim();
        if (line === '') {
          if (linesToSkip === j) linesToSkip++;
          continue;
        }
        if (headerPatterns.some(pattern => pattern.test(line))) {
          linesToSkip = j + 1;
        } else if (linesToSkip > 0) {
          // Once we've skipped some header lines and hit real content, stop skipping
          break;
        }
      }
      cleanedContent = lines.slice(linesToSkip).join('\n').trim();

      sections = [{
        properties: {
          page: {
            margin: {
              top: 1134, // 2cm
              right: 850, // 1.5cm
              bottom: 1134, // 2cm
              left: 1701, // 3cm
            }
          }
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", bold: true, size: 24, font: "Times New Roman" }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Độc lập – Tự do – Hạnh phúc", bold: true, size: 26, font: "Times New Roman", underline: { type: UnderlineType.SINGLE } }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Phú Quốc, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}`, italics: true, size: 24, font: "Times New Roman" }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "ĐƠN YÊU CẦU CÔNG NHẬN SÁNG KIẾN", bold: true, size: 32, font: "Times New Roman" }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
          }),
          ...(() => {
            const lines = cleanedContent.split('\n');
            const result: any[] = [];
            let i = 0;

            const parseRow = (l: string) => {
              const cells = l.trim().split('|');
              if (cells[0] === '') cells.shift();
              if (cells[cells.length - 1] === '') cells.pop();
              return cells.map(c => c.trim().replace(/\*\*/g, '').replace(/^\s*\*+\s*/, ''));
            };

            while (i < lines.length) {
              const line = lines[i].trim();
              const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';

              // Detect table start: current line has pipes, next line is a separator (pipes and dashes)
              const isSeparator = nextLine.startsWith('|') && nextLine.includes('---') && /^[\s|:-]+$/.test(nextLine);

              if (line.startsWith('|') && isSeparator) {
                const tableData: string[][] = [];
                // Header
                tableData.push(parseRow(lines[i]));
                i += 2; // Skip header and separator

                // Body
                while (i < lines.length && lines[i].trim().startsWith('|')) {
                  tableData.push(parseRow(lines[i]));
                  i++;
                }

                result.push(new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                    bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                    left: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                    right: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                    insideHorizontal: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                    insideVertical: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                  },
                  rows: tableData.map((row, rowIndex) => new TableRow({
                    children: row.map(cell => new TableCell({
                      children: [new Paragraph({
                        children: [new TextRun({ text: cell, bold: rowIndex === 0, font: "Times New Roman", size: 28 })],
                        alignment: rowIndex === 0 ? AlignmentType.CENTER : AlignmentType.LEFT
                      })],
                      shading: rowIndex === 0 ? { fill: "F2F2F2" } : undefined,
                      verticalAlign: VerticalAlign.CENTER,
                      margins: { top: 100, bottom: 100, left: 100, right: 100 }
                    }))
                  }))
                }));
                result.push(new Paragraph({ spacing: { after: 200 } }));
              } else {
                // Strip Markdown bullet points (asterisks) for SKKN mode
                let processedLine = line.replace(/^\s*\*+\s*/, '');
                if (processedLine !== '') {
                  const isSectionHeader = /^[I|V|X]+\./.test(processedLine);
                  const isSubHeader = /^[0-9]+\./.test(processedLine) || /^[0-9]+\.[0-9]+/.test(processedLine);
                  const isKinhGui = processedLine.startsWith("Kính gửi:");

                  // Handle bold text in paragraphs
                  const parts = processedLine.split(/(\*\*.*?\*\*)/g);
                  const children = parts.map(part => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return new TextRun({ text: part.slice(2, -2), bold: true, size: 28, font: "Times New Roman" });
                    }
                    return new TextRun({
                      text: isSectionHeader ? part.toUpperCase() : part,
                      bold: isSectionHeader || isSubHeader || isKinhGui,
                      size: 28,
                      font: "Times New Roman"
                    });
                  });

                  result.push(new Paragraph({
                    children,
                    spacing: { after: 200, line: 360 },
                    alignment: processedLine.includes("NGƯỜI LÀM ĐƠN") || processedLine.includes("NGƯỜI YÊU CẦU") || processedLine.includes("ngày ... tháng ... năm")
                      ? AlignmentType.RIGHT
                      : AlignmentType.JUSTIFIED,
                  }));
                }
                i++;
              }
            }
            return result;
          })(),
        ],
      }];
    } else if (isSpellcheck && tableRows.length > 0) {
      const table = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
        },
        rows: [
          new TableRow({
            children: ["STT", "Từ sai/Lỗi logic", "Vị trí", "Đoạn văn chứa lỗi", "Dạng đúng/Đề xuất", "Giải thích lý do (Trích dẫn NĐ 30 hoặc QĐ 240/QĐ)"].map(text =>
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text, bold: true, font: "Times New Roman", size: 28 })], alignment: AlignmentType.CENTER })],
                verticalAlign: VerticalAlign.CENTER,
              })
            ),
          }),
          ...tableRows.map(row =>
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: row[0], font: "Times New Roman", size: 28 })], alignment: AlignmentType.CENTER })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: row[1], color: "FF0000", bold: true, font: "Times New Roman", size: 28 })], alignment: AlignmentType.CENTER })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: row[2], font: "Times New Roman", size: 28 })], alignment: AlignmentType.CENTER })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: row[3], font: "Times New Roman", italics: true, size: 28 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: row[4], color: "008000", bold: true, font: "Times New Roman", size: 28 })], alignment: AlignmentType.CENTER })], verticalAlign: VerticalAlign.CENTER }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: row[5], font: "Times New Roman", size: 28 })] })] }),
              ],
            })
          ),
        ],
      });

      sections = [{
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: "BÁO CÁO HIỆU ĐÍNH HỌC THUẬT CHUYÊN SÂU", bold: true, size: 36, font: "Times New Roman" })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "Được thực hiện bởi Nhà giáo nhân dân - Giáo sư (VisionScript AI)", italics: true, size: 28, font: "Times New Roman" })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `Tên tài liệu: ${fileData?.name || "Tài liệu không tên"}`, bold: true, size: 28, font: "Times New Roman" })],
            spacing: { after: 400 },
          }),
          table,
          new Paragraph({
            children: [new TextRun({ text: `Tổng số lỗi phát hiện: ${reportData?.total_errors || tableRows.length}`, bold: true, size: 28, font: "Times New Roman" })],
            spacing: { before: 600, after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `Nhận xét tổng thể: ${reportData?.expert_summary || ""}`, size: 28, font: "Times New Roman" })],
            spacing: { after: 400 },
          }),
          ...(reportData?.formatting_analysis ? [
            new Paragraph({
              children: [new TextRun({ text: "PHÂN TÍCH THỂ THỨC (NĐ 30/2020/NĐ-CP)", bold: true, size: 28, font: "Times New Roman" })],
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              children: [new TextRun({ text: `Trạng thái: ${reportData.formatting_analysis.status}`, bold: true, color: reportData.formatting_analysis.status === 'Đạt' ? '008000' : 'FF0000', size: 28, font: "Times New Roman" })],
              spacing: { after: 200 },
            }),
            new Paragraph({
              children: [new TextRun({ text: "Các vấn đề phát hiện:", bold: true, size: 28, font: "Times New Roman" })],
              spacing: { after: 100 },
            }),
            ...reportData.formatting_analysis.issues.map((issue: string) => new Paragraph({
              children: [new TextRun({ text: `• ${issue}`, size: 28, font: "Times New Roman" })],
              spacing: { after: 100 },
              indent: { left: 720 },
            })),
            new Paragraph({
              children: [new TextRun({ text: "Đề xuất chỉnh sửa:", bold: true, size: 28, font: "Times New Roman" })],
              spacing: { before: 200, after: 100 },
            }),
            ...reportData.formatting_analysis.recommendations.map((rec: string) => new Paragraph({
              children: [new TextRun({ text: `→ ${rec}`, size: 28, font: "Times New Roman" })],
              spacing: { after: 100 },
              indent: { left: 720 },
            })),
          ] : []),
          new Paragraph({
            children: [new TextRun({ text: `Ngày xuất báo cáo: ${new Date().toLocaleString('vi-VN')}`, italics: true, size: 20, font: "Times New Roman" })],
            alignment: AlignmentType.RIGHT,
            spacing: { before: 600 },
          }),
        ],
      }];
    } else {
      sections = [{
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 32, font: "Times New Roman" })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          ...content.split('\n').map(line => {
            const isHeader = /^[0-9\.]+\s[A-ZÀ-Ỹ]/.test(line) || /^[A-ZÀ-Ỹ]{2,}/.test(line);
            return new Paragraph({
              children: [new TextRun({ text: line.replace(/\*\*/g, ''), bold: isHeader, size: 28, font: "Times New Roman" })],
              spacing: { after: 200, line: 360 },
            });
          }),
        ],
      }];
    }

    const doc = new Document({ sections });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${title.replace(/\s+/g, '_')}.docx`);
  };

  const handleProcess = async () => {
    setStatus(AppStatus.LOADING);
    setRawOutput('');
    setError(null);

    let finalPrompt = inputText;
    let finalBase64 = fileData?.base64 || "";
    let finalMime = fileData?.mimeType || "text/plain";

    // Handle case without fileData (e.g., SKKN generation from scratch)
    if (!fileData && activePreset !== 'rewrite' && rewriteStyle !== 'skkn' && !audioChunksRef.current.length) {
      setError("Vui lòng tải lên tài liệu gốc để xử lý (trừ khi tạo mới SKKN hoặc có ghi âm).");
      setStatus(AppStatus.ERROR);
      return;
    }

    if (activePreset === 'rewrite' && rewriteStyle === 'skkn') {
      finalPrompt = `
        BẠN LÀ NHÀ GIÁO NHÂN DÂN - GIÁO SƯ TIẾN SĨ NGÔN NGỮ HỌC VIỆT NAM VỚI 45 NĂM KINH NGHIỆM. 
        HÃY SOẠN THẢO ĐƠN YÊU CẦU CÔNG NHẬN SÁNG KIẾN NĂM 2026 HOÀN CHỈNH, XUẤT SẮC VÀ CHUYÊN NGHIỆP NHẤT.
        
        VỚI TƯ CÁCH LÀ MỘT NHÀ NGÔN NGỮ HỌC TÀI BA, HÃY SỬ DỤNG NGÔN TỪ TINH TẾ, SẮC BÉN, GIÀU TÍNH THUYẾT PHỤC VÀ ĐÚNG CHUẨN MỰC HÀNH CHÍNH KHOA HỌC.

        I. THÔNG TIN TÁC GIẢ & ĐƠN VỊ (CHỈ SỬ DỤNG NẾU CÓ, NẾU TRỐNG HÃY ĐỂ TRỐNG TRONG VĂN BẢN):
        - Họ tên: ${skknData.authorName || '...'}
        - Ngày sinh: ${skknData.authorDOB || '...'}
        - Nơi công tác: ${skknData.authorWorkplace || '...'}
        - Chức danh: ${skknData.authorTitle || '...'}
        - Trình độ: ${skknData.authorLevel || '...'}
        - Đóng góp: ${skknData.authorContribution || '...'}%
        ${skknData.participants.length > 0 ? `- Người tham gia khác: ${skknData.participants.map(p => `${p.name} (${p.contribution}%)`).join(', ')}` : ''}
        
        II. THÔNG TIN SÁNG KIẾN:
        - Tên sáng kiến: ${skknData.initiativeName || '...'}
        - Lĩnh vực: ${skknData.applicationField || '...'}
        - Ngày áp dụng: ${skknData.firstAppliedDate || '...'}
        - Chủ đầu tư: ${skknData.investor || '...'}
        
        III. YÊU CẦU VỀ NỘI DUNG VÀ VĂN PHONG (HÃY VIẾT DÀI, CỰC KỲ CỤ THỂ VÀ CHI TIẾT):
        1. VĂN PHONG: Viết dưới dạng các đoạn văn xuôi kết nối chặt chẽ, trôi chảy. TUYỆT ĐỐI KHÔNG SỬ DỤNG GẠCH ĐẦU DÒNG trong các phần nội dung (trừ bảng biểu).
        2. SÁNG TẠO DỮ LIỆU: Hãy tự sáng tạo các số liệu, minh chứng, ví dụ thực tế một cách logic và thuyết phục nhất để hoàn thiện các phần nội dung dưới đây.
        3. BẢNG BIỂU: Phải có bảng số liệu so sánh Markdown với đường kẻ rõ ràng.
        4. ĐỘ DÀI VÀ ĐỘ SÂU: Hãy viết DÀI HƠN, CHI TIẾT HƠN, SÂU SẮC HƠN. Mỗi phần phải được đầu tư suy nghĩ sâu sắc, thể hiện tầm vóc của một Giáo sư đầu ngành.

        CÁC PHẦN NỘI DUNG CẦN TRIỂN KHAI:
        1. Tình trạng giải pháp đã biết: Phân tích hiện trạng, ưu điểm, hạn chế và khoảng trống cải tiến một cách sắc sảo. (Dữ liệu gốc: ${skknData.currentState || 'AI tự sáng tạo dựa trên tên sáng kiến'})
        2. Nội dung giải pháp đề nghị công nhận là sáng kiến:
           - Mục đích của giải pháp: (Dữ liệu gốc: ${skknData.purpose || 'AI tự sáng tạo'})
           - CÁC GIẢI PHÁP CỤ THỂ (2.1, 2.2, 2.3): ĐÂY LÀ PHẦN TRỌNG TÂM. Mỗi giải pháp cần trình bày theo cấu trúc:
             + Cơ sở lý luận & Sư phạm: Liên hệ với các học thuyết giáo dục hiện đại.
             + Tính mới & Đột phá: Tại sao giải pháp này lại ưu việt hơn cách làm truyền thống?
             + Cách thức thực hiện: Mô tả chi tiết từng bước, từng hành động triển khai, quy trình thực hiện theo thời gian (Viết thật dài và cụ thể).
             + Khó khăn & Cách khắc phục: Những rào cản có thể gặp và chiến lược vượt qua.
             + Ví dụ minh chứng: Một tình huống thực tế sống động đã áp dụng thành công.
             + Bảng số liệu hoặc kết quả dự kiến: So sánh tính hiệu quả bằng số liệu tự sáng tạo logic.
           (Dữ liệu gốc: ${skknData.solution1 || 'AI tự sáng tạo'}, ${skknData.solution2 || 'AI tự sáng tạo'}, ${skknData.solution3 || 'AI tự sáng tạo'})
        3. Khả năng áp dụng của giải pháp: (Dữ liệu gốc: ${skknData.applicability || 'AI tự sáng tạo'})
        4. Hiệu quả, lợi ích thu được hoặc dự kiến có thể thu được do áp dụng giải pháp: (Dữ liệu gốc: ${skknData.benefits || 'AI tự sáng tạo'})
        5. Điều kiện cần thiết để áp dụng: (Dữ liệu gốc: ${skknData.conditions || 'AI tự sáng tạo'})
        6. Cam kết cuối đơn: Khẳng định tính trung thực và trách nhiệm.

        YÊU CẦU ĐẶC BIỆT:
        - Xuất ra một bản SKKN hoàn chỉnh, có thể sử dụng ngay.
        - Tuân thủ thể thức hành chính 2026.
        - Viết thật hay, thật xuất sắc, thể hiện sự am tường về ngôn ngữ và chuyên môn giáo dục.
      `;
    }

    setStatus(AppStatus.LOADING);
    setLoadingText("Đang khởi tạo chuyên gia 45 năm kinh nghiệm...");

    try {
      const result = await analyzeContent(
        finalBase64,
        finalMime,
        finalPrompt,
        (chunk) => {
          setRawOutput(chunk);
          if (activePreset === 'rewrite') {
            if (chunk.includes("I. THÔNG TIN")) setLoadingText("Đang thiết lập thông tin tác giả và đơn vị...");
            else if (chunk.includes("II. THÔNG TIN")) setLoadingText("Đang khởi tạo cấu trúc sáng kiến kinh nghiệm...");
            else if (chunk.includes("III. YÊU CẦU")) setLoadingText("Đang triển khai nội dung giải pháp chi tiết...");
            else if (chunk.includes("Hiệu quả")) setLoadingText("Đang tổng hợp kết quả và hiệu quả dự kiến...");
            else if (chunk.includes("Cam kết")) setLoadingText("Đang hoàn thiện văn phong hành chính cuối cùng...");
            else setLoadingText("Chuyên gia đang miệt mài biên soạn văn bản học thuật...");
          } else {
            if (chunk.includes("[MARKED_START]") && !chunk.includes("[MARKED_END]")) setLoadingText("Đang hiệu đính và đánh dấu lỗi trực tiếp...");
            else if (chunk.includes("[TABLE_START]") && !chunk.includes("[TABLE_END]")) setLoadingText("Đang lập bảng phân tích lỗi chi tiết...");
            else if (chunk.includes("[REPORT_START]") && !chunk.includes("[REPORT_END]")) setLoadingText("Đang xuất báo cáo và xếp loại học thuật...");
            else if (chunk.includes("dự phòng")) setLoadingText("Đang chuyển sang mô hình dự phòng siêu tốc...");
          }
        },
        activePreset,
        userKey,
        rewriteStyle,
        summaryLevel,
        undefined,
        selectedModel
      );
      setStatus(AppStatus.SUCCESS);

      if (activePreset === 'rewrite' && rewriteStyle === 'skkn') {
        await exportToDocx(result, skknData.initiativeName || "Don_yeu_cau_cong_nhan_sang_kien");
      }

      const newItem = { id: Date.now().toString(), fileName: fileData?.name || "Kết quả AI", timestamp: Date.now(), rawOutput: result, activePreset };
      const updatedHistory = [newItem, ...history].slice(0, 20);
      setHistory(updatedHistory);
      localStorage.setItem('VISION_SCRIPT_HISTORY', JSON.stringify(updatedHistory));
    } catch (err: any) {
      setError(err.message || "Lỗi xử lý.");
      setStatus(AppStatus.ERROR);
    }
  };

  const parsedData = useMemo(() => {
    const reportMatch = rawOutput.match(/\[REPORT_START\]([\s\S]*?)\[REPORT_END\]/);
    const tableMatch = rawOutput.match(/\[TABLE_START\]([\s\S]*?)\[TABLE_END\]/);
    const markedMatch = rawOutput.match(/\[MARKED_START\]([\s\S]*?)\[MARKED_END\]/);
    const ocrMatch = rawOutput.match(/\[OCR_START\]([\s\S]*?)\[OCR_END\]/);
    const rewriteStartMatch = rawOutput.match(/\[REWRITE_START\]([\s\S]*?)(?=\[REWRITE_EXPLANATION\]|\[REWRITE_END\])/);
    const rewriteExplMatch = rawOutput.match(/\[REWRITE_EXPLANATION\]([\s\S]*?)\[REWRITE_END\]/);

    const sumHighMatch = rawOutput.match(/\[SUMMARY_HIGHLIGHTS\]([\s\S]*?)\[SUMMARY_CONTENT\]/);
    const sumContMatch = rawOutput.match(/\[SUMMARY_CONTENT\]([\s\S]*?)\[SUMMARY_KEYWORDS\]/);
    const sumKeyMatch = rawOutput.match(/\[SUMMARY_KEYWORDS\]([\s\S]*?)\[SUMMARY_ACTION_ITEMS\]/);
    const sumActMatch = rawOutput.match(/\[SUMMARY_ACTION_ITEMS\]([\s\S]*?)\[SUMMARY_END\]/);

    const tableContent = tableMatch ? tableMatch[1].trim() : "";
    const tableLines = tableContent.split('\n').map(line => line.trim());
    const tableRows = tableLines
      .filter(line => line.startsWith('|') && line.includes('|'))
      .map(line => line.split('|').map(cell => cell.trim()).slice(1, -1))
      .filter(row => row.length >= 6 && !row.some(c => c.includes('---')) && !row.some(c => c.toLowerCase().includes('từ sai') || c.toLowerCase().includes('lỗi logic')));

    let reportData = null;
    if (reportMatch) { try { reportData = JSON.parse(reportMatch[1].trim()); } catch (e) { } }

    return {
      reportData,
      tableRows,
      markedText: markedMatch ? markedMatch[1].trim() : "",
      ocrText: ocrMatch ? ocrMatch[1].trim() : (activePreset === 'ocr' ? rawOutput : ""),
      rewriteText: rewriteStartMatch ? rewriteStartMatch[1].trim() : (activePreset === 'rewrite' && !rewriteExplMatch ? rawOutput : ""),
      rewriteExplanation: rewriteExplMatch ? rewriteExplMatch[1].trim() : "",
      summaryHighlights: sumHighMatch ? sumHighMatch[1].trim().split('\n').map(l => l.replace(/^- /, "").replace(/\*\*/g, "").trim()).filter(l => l) : [],
      summaryContent: sumContMatch ? sumContMatch[1].trim().replace(/\*\*/g, "") : (activePreset === 'summary' && !sumHighMatch ? rawOutput.replace(/\*\*/g, "") : ""),
      summaryKeywords: sumKeyMatch ? sumKeyMatch[1].trim().split(',').map(k => k.trim()).filter(k => k) : [],
      summaryActionItems: sumActMatch ? sumActMatch[1].trim().split('\n').map(l => l.replace(/^- /, "").replace(/\*\*/g, "").trim()).filter(l => l) : []
    };
  }, [rawOutput, activePreset]);

  const handleCopy = () => {
    let textToCopy = parsedData.rewriteText || parsedData.summaryContent || parsedData.ocrText || rawOutput;
    textToCopy = textToCopy.replace(/\*/g, "");
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden relative">
      <div
        className={`fixed inset-0 bg-slate-900/50 z-40 transition-opacity lg:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      />
      <aside className={`w-80 bg-[#FFFBEB] md:bg-[#FFFBEB]/50 border-r border-yellow-100 flex flex-col z-50 shadow-2xl fixed inset-y-0 left-0 lg:static lg:translate-x-0 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-yellow-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <EduLogo className="w-6 h-6" />
            <div>
              <h1 className="font-black text-slate-900 text-[18px] uppercase tracking-tighter leading-none">VisionScript</h1>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.1em] mt-1.5 inline-block">TRƯỜNG TH&THCS BÃI THƠM</span>
            </div>
          </div>
          <button className="lg:hidden text-slate-400 p-2" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6 space-y-8 custom-scrollbar">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-pink-600 uppercase tracking-widest flex items-center gap-2">
                <KeyIcon className="w-3 h-3" /> CẤU HÌNH API
              </label>
              <a href="https://aistudio.google.com/app/api-keys" target="_blank" rel="noopener noreferrer" className="text-[9px] font-black text-slate-900 hover:underline uppercase tracking-tighter">Get the APK here</a>
            </div>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={userKey}
                onChange={(e) => setUserKey(e.target.value)}
                placeholder="Nhập Gemini API Key..."
                className="w-full pl-3 pr-8 py-2 text-[10px] font-bold bg-white border border-yellow-100 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-50 outline-none transition-all shadow-sm"
              />
              <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-500">
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <Button variant="primary" size="sm" onClick={saveKey} className="w-full h-8 text-[10px] font-black uppercase rounded-lg">
              {keySaved ? "ĐÃ LƯU" : "LƯU KEY"}
            </Button>
          </section>

          <section className="space-y-3">
            <label className="text-[10px] font-black text-pink-600 uppercase tracking-widest flex items-center gap-2">
              <Cpu className="w-3 h-3" /> MÔ HÌNH AI
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 text-[10px] font-bold bg-white border border-yellow-100 rounded-xl focus:border-blue-500 outline-none transition-all shadow-sm appearance-none cursor-pointer"
            >
              {AI_MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-pink-600 uppercase tracking-widest flex items-center gap-2">
                <Upload className="w-3 h-3" /> TÀI LIỆU GỐC
              </label>
            </div>

            <div
              className={`h-28 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${fileData ? 'border-pink-300 bg-pink-50/30' : 'border-yellow-200 bg-white shadow-inner'}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {fileData ? (
                <div className="flex flex-col items-center gap-2 px-4">
                  {fileData.mimeType.startsWith('image/') ? (
                    <img src={fileData.base64} alt="Preview" className="w-8 h-8 object-cover rounded shadow-sm" />
                  ) : (
                    <FileText className="w-6 h-6 text-pink-500" />
                  )}
                  <span className="text-[10px] font-black uppercase text-pink-700 truncate max-w-full">{fileData.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <p className="text-[11px] text-slate-400 font-black uppercase">TẢI TỆP .DOCX / ẢNH</p>
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf,.docx" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
          </section>

          <div className="space-y-6 pt-4">
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              {activePreset === 'summary' && (
                <div className="grid grid-cols-1 gap-2">
                  {SUMMARY_LEVELS.map(level => (
                    <button
                      key={level.id}
                      onClick={() => setSummaryLevel(level.id)}
                      className={`h-16 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${summaryLevel === level.id ? 'bg-purple-600 border-purple-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-purple-100'}`}
                    >
                      <div className="mb-1">{level.icon}</div>
                      <span className={`text-[8px] font-black uppercase tracking-tighter text-center leading-tight ${summaryLevel === level.id ? 'text-white' : 'text-slate-400'}`}>{level.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {activePreset === 'rewrite' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {REWRITE_STYLES.map(style => (
                    <button
                      key={style.id}
                      onClick={() => setRewriteStyle(style.id)}
                      className={`h-14 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${rewriteStyle === style.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-red-600 hover:border-blue-100'}`}
                    >
                      <div className="mb-1">{style.icon}</div>
                      <span className={`text-[6px] font-black uppercase tracking-tighter text-center leading-tight px-1 ${rewriteStyle === style.id ? 'text-white' : 'text-red-600'}`}>{style.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <section className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2">
                {PRESETS.map(p => (
                  <button
                    key={p.id}
                    title={p.label}
                    onClick={() => { setInputText(p.prompt); setActivePreset(p.id); }}
                    className={`h-14 rounded-2xl border-2 flex flex-col items-center justify-center transition-all group ${activePreset === p.id ? 'bg-pink-600 border-pink-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-pink-100'}`}
                  >
                    <div className="mb-1">{p.icon}</div>
                    <span className={`text-[7px] font-black uppercase tracking-tighter ${activePreset === p.id ? 'text-white' : 'text-slate-400'}`}>{p.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <div className="h-4 w-full shrink-0"></div>
          </div>
        </div>

        <div className="p-6 bg-[#FFFBEB] border-t border-yellow-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] space-y-4">
          {error && <ErrorBanner message={error} />}
          <Button
            className={`w-full py-6 rounded-2xl text-[12px] font-black uppercase shadow-xl transition-all active:scale-95 group ${status === AppStatus.LOADING ? 'opacity-70' :
              activePreset === 'summary' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-100' :
                activePreset === 'spellcheck' ? 'bg-pink-600 hover:bg-pink-700 shadow-pink-100' :
                  activePreset === 'rewrite' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100' :
                    'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
              }`}
            onClick={handleProcess}
            isLoading={status === AppStatus.LOADING}
            disabled={status === AppStatus.LOADING || (!fileData && (activePreset !== 'rewrite' || rewriteStyle !== 'skkn'))}
          >
            {status === AppStatus.LOADING ? "ĐANG XỬ LÝ..." : "BẮT ĐẦU XỬ LÝ"} <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </aside>

      <main className="flex-grow flex flex-col relative overflow-hidden bg-white w-full">
        <header className="h-16 md:h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex flex-col md:flex-row items-center justify-between px-4 md:px-10 shadow-sm z-10 py-3 md:py-0 gap-3 md:gap-0">
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-3 md:gap-4">
              <button className="lg:hidden text-slate-600 p-2" onClick={() => setIsSidebarOpen(true)}>
                <Menu className="w-6 h-6" />
              </button>
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center ${activePreset === 'summary' ? 'bg-purple-50' : 'bg-pink-50'}`}>
                {activePreset === 'summary' ? <BookMarked className="w-5 h-5 md:w-6 md:h-6 text-purple-600" /> : <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-pink-500" />}
              </div>
              <div>
                <h2 className={`text-[11px] md:text-[13px] font-black uppercase tracking-widest leading-none ${activePreset === 'summary' ? 'text-purple-600' : 'text-pink-600'}`}>
                  {activePreset === 'spellcheck' ? 'KẾT QUẢ HIỆU ĐÍNH' : activePreset === 'summary' ? 'TÓM TẮT ĐA TẦNG' : 'KẾT QUẢ XỬ LÝ AI'}
                </h2>
                <span className="hidden md:inline-block text-[9px] font-black text-slate-400 uppercase tracking-[0.5em] mt-1.5">CHUYÊN GIA 45 NĂM KINH NGHIỆM</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-hide shrink-0">
            {activePreset === 'spellcheck' && parsedData.reportData && (
              <Button
                onClick={() => exportToDocx(rawOutput, "Bao_cao_hieu_dinh", true, parsedData.tableRows, parsedData.reportData)}
                variant="outline" size="sm" className="rounded-full border-slate-200 text-slate-600 px-4 whitespace-nowrap md:px-6 font-bold"
              >
                <Download className="w-4 h-4" /> <span className="hidden md:inline">TẢI FILE WORD</span> ({parsedData.reportData.total_errors} LỖI)
              </Button>
            )}
            {activePreset === 'rewrite' && rewriteStyle !== 'skkn' && rawOutput && (
              <Button
                onClick={() => setShowDiff(!showDiff)}
                variant="outline" size="sm" className={`rounded-full px-4 whitespace-nowrap md:px-6 font-bold ${showDiff ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-slate-200 text-slate-600'}`}
              >
                <RefreshCw className="w-4 h-4" /> {showDiff ? 'ẨN SO SÁNH' : 'SO SÁNH'}
              </Button>
            )}
            {rawOutput && activePreset !== 'spellcheck' && (activePreset !== 'rewrite' || rewriteStyle !== 'skkn') && (
              <Button
                onClick={handleOriginalityCheck}
                variant="outline" size="sm" className={`rounded-full px-4 whitespace-nowrap md:px-6 font-bold ${originalityReport ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'border-slate-200 text-slate-600'}`}
                isLoading={isProcessingOriginality}
              >
                <SearchCheck className="w-4 h-4" /> <span className="hidden md:inline">{originalityReport ? 'CẬP NHẬT ' : 'KIỂM TRA '} NGUYÊN BẢN</span>
              </Button>
            )}
            {activePreset === 'rewrite' && rewriteStyle === 'skkn' && rawOutput && (
              <Button
                onClick={() => exportToDocx(parsedData.rewriteText || rawOutput, skknData.initiativeName || "Don_Yeu_Cau_Cong_Nhan_Sang_Kien")}
                variant="primary" size="sm" className="rounded-full bg-blue-600 hover:bg-blue-700 text-white border-none px-4 md:px-6 font-bold shadow-lg shadow-blue-200/50"
              >
                <Download className="w-4 h-4" /> <span className="hidden md:inline">TẢI FILE WORD (.DOCX)</span>
              </Button>
            )}
            {rawOutput && activePreset !== 'spellcheck' && (
              <Button onClick={handleCopy} variant="primary" size="sm" className={`rounded-full text-[10px] font-black px-4 whitespace-nowrap md:px-6 ${copied ? 'bg-emerald-500' : activePreset === 'summary' ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-100' : 'bg-blue-600'}`}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'ĐÃ COPY' : 'COPY'}
              </Button>
            )}
          </div>
        </header>

        <div className="flex-grow overflow-y-auto custom-scrollbar p-4 md:p-10 bg-[#F8FAFC]/30">
          {status === AppStatus.IDLE && !(activePreset === 'rewrite' && rewriteStyle === 'skkn') ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-200 animate-in fade-in duration-700">
              <div className="relative mb-8">
                <div className="w-40 h-40 bg-slate-50/50 rounded-full flex items-center justify-center border border-slate-100">
                  <FileSearch className="w-20 h-20 text-slate-200 stroke-[1]" />
                </div>
              </div>
              <p className="text-[13px] font-black text-slate-300 uppercase tracking-[0.4em] text-center">CHUYÊN GIA ĐANG ĐỢI TÀI LIỆU...</p>
            </div>
          ) : status === AppStatus.LOADING && !rawOutput ? (
            <div className="h-full flex flex-col items-center justify-center gap-6">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest animate-pulse">{loadingText}</p>
            </div>
          ) : activePreset === 'rewrite' && rewriteStyle === 'skkn' && status !== AppStatus.SUCCESS && status !== AppStatus.LOADING ? (
            <div className="max-w-6xl mx-auto animate-in zoom-in-95 duration-500 pb-12">
              <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                {/* Left Navigation Rail */}
                <div className="w-full md:w-64 flex-shrink-0 space-y-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                  <div className="p-4 mb-4 bg-blue-50 rounded-2xl border border-blue-100 min-w-[200px]">
                    <h3 className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-1">Tiến độ soạn thảo</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex-grow h-1.5 bg-blue-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${(skknStep / 5) * 100}%` }}></div>
                      </div>
                      <span className="text-[10px] font-black text-blue-700">{skknStep}/5</span>
                    </div>
                  </div>

                  <div className="flex md:flex-col gap-2 min-w-max md:min-w-0">
                    {[
                      { id: 1, label: 'Tác giả', icon: <Users className="w-4 h-4" /> },
                      { id: 2, label: 'Sáng kiến', icon: <Lightbulb className="w-4 h-4" /> },
                      { id: 3, label: 'Giải pháp', icon: <Cpu className="w-4 h-4" /> },
                      { id: 4, label: 'Hiệu quả', icon: <Activity className="w-4 h-4" /> },
                      { id: 5, label: 'Xuất form', icon: <FileSignature className="w-4 h-4" /> },
                    ].map((step) => (
                      <button
                        key={step.id}
                        onClick={() => setSkknStep(step.id)}
                        className={`flex-1 md:w-full flex md:items-center justify-center md:justify-start gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl text-[12px] font-bold transition-all ${skknStep === step.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-500 bg-white md:bg-transparent hover:bg-slate-50 border border-slate-100 md:border-transparent'}`}
                      >
                        {step.icon}
                        <span className="hidden md:inline">{step.label}</span>
                        <span className="md:hidden inline-block">{step.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Form Content */}
                <div className="flex-grow space-y-8">
                  {skknStep === 1 && (
                    <section className="space-y-4 md:space-y-6 animate-in slide-in-from-right-4 duration-300">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-blue-600" />
                          <h3 className="text-[14px] md:text-[16px] font-black text-slate-800 uppercase tracking-tight">Thông tin tác giả</h3>
                        </div>
                        <Button
                          variant={isRecording ? "danger" : "outline"}
                          size="sm"
                          className={`rounded-full px-4 h-9 font-black text-[10px] w-full sm:w-auto transition-all ${isRecording ? 'animate-pulse' : 'border-blue-200 text-blue-600'}`}
                          onClick={isRecording ? stopRecording : startRecording}
                        >
                          {isRecording ? <MicOff className="w-3.5 h-3.5 mr-2" /> : <Mic className="w-3.5 h-3.5 mr-2" />}
                          {isRecording ? "ĐANG GHI Âm" : "NÓI Ý TƯỞNG"}
                        </Button>
                      </div>
                      <Card className="p-4 md:p-8 space-y-4 md:space-y-6 border-blue-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">HỌ VÀ TÊN</label>
                            <input
                              value={skknData.authorName}
                              onChange={(e) => setSkknData({ ...skknData, authorName: e.target.value })}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all"
                              placeholder="Nguyễn Văn A"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">NGÀY THÁNG NĂM SINH</label>
                            <input
                              value={skknData.authorDOB}
                              onChange={(e) => setSkknData({ ...skknData, authorDOB: e.target.value })}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all"
                              placeholder="01/01/1985"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">NƠI CÔNG TÁC</label>
                            <input
                              value={skknData.authorWorkplace}
                              onChange={(e) => setSkknData({ ...skknData, authorWorkplace: e.target.value })}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all"
                              placeholder="Trường TH&THCS Bãi Thơm"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">CHỨC DANH</label>
                            <input
                              value={skknData.authorTitle}
                              onChange={(e) => setSkknData({ ...skknData, authorTitle: e.target.value })}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all"
                              placeholder="Giáo viên"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">TRÌNH ĐỘ CHUYÊN MÔN</label>
                            <input
                              value={skknData.authorLevel}
                              onChange={(e) => setSkknData({ ...skknData, authorLevel: e.target.value })}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all"
                              placeholder="Cử nhân Sư phạm"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">TỶ LỆ ĐÓNG GÓP (%)</label>
                            <input
                              type="number"
                              value={skknData.authorContribution}
                              onChange={(e) => setSkknData({ ...skknData, authorContribution: e.target.value })}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all"
                              placeholder="100"
                            />
                          </div>
                        </div>
                      </Card>
                    </section>
                  )}

                  {skknStep === 2 && (
                    <section className="space-y-4 md:space-y-6 animate-in slide-in-from-right-4 duration-300">
                      <div className="flex items-center gap-3">
                        <Lightbulb className="w-5 h-5 text-blue-600" />
                        <h3 className="text-[14px] md:text-[16px] font-black text-slate-800 uppercase tracking-tight">Thông tin sáng kiến</h3>
                      </div>
                      <Card className="p-4 md:p-8 space-y-4 md:space-y-6 border-blue-50">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">TÊN SÁNG KIẾN</label>
                          <textarea
                            value={skknData.initiativeName}
                            onChange={(e) => setSkknData({ ...skknData, initiativeName: e.target.value })}
                            rows={2}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all resize-none"
                            placeholder="Nhập tên sáng kiến đầy đủ..."
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">LĨNH VỰC ÁP DỤNG</label>
                            <input
                              value={skknData.applicationField}
                              onChange={(e) => setSkknData({ ...skknData, applicationField: e.target.value })}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all"
                              placeholder="Giảng dạy môn Toán..."
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">NGÀY ÁP DỤNG LẦN ĐẦU</label>
                            <input
                              value={skknData.firstAppliedDate}
                              onChange={(e) => setSkknData({ ...skknData, firstAppliedDate: e.target.value })}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all"
                              placeholder="05/09/2025"
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">CHỦ ĐẦU TƯ (NẾU CÓ)</label>
                            <input
                              value={skknData.investor}
                              onChange={(e) => setSkknData({ ...skknData, investor: e.target.value })}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all"
                              placeholder="Trường TH&THCS Bãi Thơm"
                            />
                          </div>
                        </div>
                      </Card>
                    </section>
                  )}

                  {skknStep === 3 && (
                    <section className="space-y-4 md:space-y-6 animate-in slide-in-from-right-4 duration-300">
                      <div className="flex items-center gap-3">
                        <Cpu className="w-5 h-5 text-blue-600" />
                        <h3 className="text-[14px] md:text-[16px] font-black text-slate-800 uppercase tracking-tight">Nội dung giải pháp</h3>
                      </div>
                      <Card className="p-4 md:p-8 space-y-4 md:space-y-6 border-blue-50">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">TÌNH TRẠNG GIẢI PHÁP ĐÃ BIẾT</label>
                          <textarea
                            value={skknData.currentState}
                            onChange={(e) => setSkknData({ ...skknData, currentState: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all resize-none"
                            placeholder="Mô tả hiện trạng, ưu điểm và hạn chế của giải pháp cũ..."
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">MỤC ĐÍCH CỦA GIẢI PHÁP</label>
                          <textarea
                            value={skknData.purpose}
                            onChange={(e) => setSkknData({ ...skknData, purpose: e.target.value })}
                            rows={2}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all resize-none"
                            placeholder="Giải quyết vấn đề gì? Đạt được kết quả gì?"
                          />
                        </div>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">NỘI DUNG GIẢI PHÁP 1</label>
                            <textarea
                              value={skknData.solution1}
                              onChange={(e) => setSkknData({ ...skknData, solution1: e.target.value })}
                              rows={3}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all resize-none"
                              placeholder="Chi tiết giải pháp 1..."
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">NỘI DUNG GIẢI PHÁP 2</label>
                            <textarea
                              value={skknData.solution2}
                              onChange={(e) => setSkknData({ ...skknData, solution2: e.target.value })}
                              rows={3}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all resize-none"
                              placeholder="Chi tiết giải pháp 2..."
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">NỘI DUNG GIẢI PHÁP 3</label>
                            <textarea
                              value={skknData.solution3}
                              onChange={(e) => setSkknData({ ...skknData, solution3: e.target.value })}
                              rows={3}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all resize-none"
                              placeholder="Chi tiết giải pháp 3..."
                            />
                          </div>
                        </div>
                        <div className="pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl text-[10px] font-black border-blue-200 text-blue-600"
                            onClick={() => setSkknData({ ...skknData, solution1: "AI đang gợi ý giải pháp...", solution2: "AI đang gợi ý giải pháp...", solution3: "AI đang gợi ý giải pháp..." })}
                          >
                            <Sparkles className="w-3 h-3 mr-2" /> VIẾT GIẢI PHÁP (AI)
                          </Button>
                        </div>
                      </Card>
                    </section>
                  )}

                  {skknStep === 4 && (
                    <section className="space-y-4 md:space-y-6 animate-in slide-in-from-right-4 duration-300">
                      <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-blue-600" />
                        <h3 className="text-[14px] md:text-[16px] font-black text-slate-800 uppercase tracking-tight">Hiệu quả & Khả năng áp dụng</h3>
                      </div>
                      <Card className="p-4 md:p-8 space-y-4 md:space-y-6 border-blue-50">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">KHẢ NĂNG ÁP DỤNG</label>
                          <textarea
                            value={skknData.applicability}
                            onChange={(e) => setSkknData({ ...skknData, applicability: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all resize-none"
                            placeholder="Đối tượng áp dụng, phạm vi áp dụng..."
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">HIỆU QUẢ - LỢI ÍCH THU ĐƯỢC</label>
                          <textarea
                            value={skknData.benefits}
                            onChange={(e) => setSkknData({ ...skknData, benefits: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all resize-none"
                            placeholder="So sánh trước và sau, hiệu quả kinh tế - xã hội..."
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">ĐIỀU KIỆN ÁP DỤNG</label>
                          <textarea
                            value={skknData.conditions}
                            onChange={(e) => setSkknData({ ...skknData, conditions: e.target.value })}
                            rows={2}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all resize-none"
                            placeholder="Cơ sở vật chất, con người cần thiết..."
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">THÔNG TIN CẦN BẢO MẬT (NẾU CÓ)</label>
                          <input
                            value={skknData.confidentialInfo}
                            onChange={(e) => setSkknData({ ...skknData, confidentialInfo: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[14px] font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-50 transition-all"
                            placeholder="Nội dung cần bảo mật..."
                          />
                        </div>
                        <div className="flex flex-col md:flex-row gap-2 pt-2 w-full">
                          <Button
                            variant="outline"
                            size="sm"
                            className={`w-full rounded-xl text-[10px] font-black transition-all duration-500 ${tableGenerated ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-emerald-200 text-emerald-600'}`}
                            onClick={() => {
                              setSkknData({ ...skknData, benefits: "AI đang sinh bảng số liệu..." });
                              setTableGenerated(true);
                              setTimeout(() => setTableGenerated(false), 3000);
                            }}
                          >
                            {tableGenerated ? <CheckCircle2 className="w-3 h-3 mr-2 animate-bounce" /> : <TableIcon className="w-3 h-3 mr-2" />}
                            {tableGenerated ? "ĐÃ THIẾT LẬP BẢNG" : "SINH BẢNG SỐ LIỆU"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={`w-full rounded-xl text-[10px] font-black transition-all duration-500 ${reviewGenerated ? 'bg-purple-50 border-purple-500 text-purple-700' : 'border-purple-200 text-purple-600'}`}
                            onClick={() => {
                              setSkknData({ ...skknData, benefits: "AI đang viết đánh giá..." });
                              setReviewGenerated(true);
                              setTimeout(() => setReviewGenerated(false), 3000);
                            }}
                          >
                            {reviewGenerated ? <CheckCircle2 className="w-3 h-3 mr-2 animate-bounce" /> : <Pen className="w-3 h-3 mr-2" />}
                            {reviewGenerated ? "ĐÃ SOẠN ĐÁNH GIÁ" : "VIẾT ĐÁNH GIÁ HIỆU QUẢ"}
                          </Button>
                        </div>
                      </Card>
                    </section>
                  )}

                  {skknStep === 5 && (
                    <section className="space-y-4 md:space-y-6 animate-in slide-in-from-right-4 duration-300">
                      <div className="flex items-center gap-3">
                        <FileSignature className="w-5 h-5 text-blue-600" />
                        <h3 className="text-[14px] md:text-[16px] font-black text-slate-800 uppercase tracking-tight">Hoàn thiện & Xuất đơn</h3>
                      </div>
                      <Card className="p-6 md:p-10 flex flex-col items-center justify-center text-center gap-6 border-blue-50">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-10 h-10 text-blue-500" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-[18px] font-black text-slate-800 uppercase">Sẵn sàng khởi tạo đơn</h4>
                          <p className="text-[13px] text-slate-500 font-medium max-w-md">
                            Hệ thống AI sẽ dựa trên thông tin bạn đã cung cấp để soạn thảo một lá đơn yêu cầu công nhận sáng kiến hoàn chỉnh đúng mẫu 2026.
                          </p>
                        </div>

                        <div className="flex flex-col w-full max-w-sm gap-3">
                          <Button
                            variant="outline"
                            className="w-full py-4 rounded-2xl border-slate-200 text-slate-600 text-[12px] font-black uppercase"
                            onClick={handleLogicCheck}
                            isLoading={isProcessingLogic}
                          >
                            <ShieldCheck className="w-4 h-4 mr-2" /> {logicCheckResult ? 'CẬP NHẬT KIỂM TRA LOGIC' : 'KIỂM TRA LOGIC HÀNH CHÍNH'}
                          </Button>

                          {logicCheckResult && (
                            <div className="p-4 bg-white border border-blue-100 rounded-2xl text-left space-y-2 animate-in fade-in slide-in-from-top-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-blue-600 uppercase">ĐIỂM LOGIC: {logicCheckResult.score}/100</span>
                                {logicCheckResult.isConsistent ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <ShieldAlert className="w-4 h-4 text-amber-500" />}
                              </div>
                              <p className="text-[11px] text-slate-600 font-medium">{logicCheckResult.analysis}</p>
                              <div className="space-y-1">
                                {logicCheckResult.recommendations.map((rec, i) => (
                                  <div key={i} className="text-[10px] text-blue-700 font-bold flex gap-1">
                                    <span>→</span> {rec}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <Button
                            className="w-full py-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-black uppercase shadow-xl transition-all group"
                            onClick={handleProcess}
                          >
                            <Cpu className="w-5 h-5 group-hover:animate-pulse" /> HOÀN THIỆN TOÀN BỘ ĐƠN
                          </Button>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                            AI sẽ tự động bổ sung các phần còn thiếu dựa trên dữ liệu bạn đã nhập
                          </p>
                        </div>
                      </Card>
                    </section>
                  )}

                  <div className="flex justify-between items-center pt-4">
                    <Button
                      variant="outline"
                      className="hidden sm:inline-flex rounded-xl px-8"
                      onClick={() => setSkknStep(Math.max(1, skknStep - 1))}
                      disabled={skknStep === 1}
                    >
                      Trở lại
                    </Button>
                    <div className="flex gap-2 w-full justify-between sm:w-auto">
                      {skknStep === 1 && (
                        <Button
                          variant="outline"
                          className="sm:hidden rounded-xl px-4"
                          disabled
                        >
                          Trở lại
                        </Button>
                      )}
                      {skknStep > 1 && (
                        <Button
                          variant="outline"
                          className="sm:hidden rounded-xl px-4"
                          onClick={() => setSkknStep(Math.max(1, skknStep - 1))}
                        >
                          Quay lại
                        </Button>
                      )}
                      {skknStep < 5 && (
                        <>
                          <Button
                            variant="ghost"
                            className="hidden sm:inline-flex rounded-xl px-6 text-blue-600 font-bold hover:bg-blue-50"
                            onClick={handleProcess}
                          >
                            <Cpu className="w-4 h-4 mr-2" /> Hoàn thiện ngay
                          </Button>
                          <Button
                            className="rounded-xl px-6 sm:px-8 bg-slate-800 text-white flex-1 sm:flex-none"
                            onClick={() => setSkknStep(Math.min(5, skknStep + 1))}
                          >
                            Tiếp theo
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-10">
              {fileData && fileData.mimeType.startsWith('image/') && (
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm relative group">
                  <div className="flex items-center gap-3 mb-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                    <ImageIcon className="w-4 h-4" /> ẢNH TÀI LIỆU GỐC
                  </div>
                  <img src={fileData.base64} alt="Original" className="max-h-[300px] w-full object-contain mx-auto rounded-xl" />
                  <button
                    onClick={() => setFileData(null)}
                    className="absolute top-4 right-4 p-2 bg-red-50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {activePreset === 'summary' && (parsedData.summaryContent || rawOutput) && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 px-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <span className="text-[11px] font-black text-purple-700 uppercase tracking-widest">ĐIỂM NHẤN TRI THỨC</span>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {parsedData.summaryHighlights.map((h, i) => (
                          <div key={i} className="bg-white p-6 rounded-[2rem] border-l-4 border-purple-400 shadow-sm hover:shadow-md transition-all">
                            <p className="text-[14px] font-bold text-slate-700 leading-relaxed font-serif">{h}</p>
                          </div>
                        ))}
                        {parsedData.summaryHighlights.length === 0 && (
                          <div className="bg-white/50 p-6 rounded-[2rem] border border-dashed border-slate-200">
                            <p className="text-[12px] text-slate-400 italic font-medium text-center">Hệ thống đang trích lọc điểm nhấn...</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 px-2">
                        <LayoutDashboard className="w-5 h-5 text-purple-600" />
                        <span className="text-[11px] font-black text-purple-700 uppercase tracking-widest">NỘI DUNG CHI TIẾT</span>
                      </div>
                      <div className="bg-white p-10 rounded-[3rem] border border-purple-50 shadow-xl shadow-purple-100/10 min-h-[400px]">
                        <p className="text-[18px] text-slate-800 leading-[2] font-serif whitespace-pre-wrap">{parsedData.summaryContent || rawOutput.replace(/\*\*/g, "")}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activePreset === 'spellcheck' && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                  {!parsedData.reportData && rawOutput && (
                    <Card className="p-10 rounded-[3rem] border-slate-100 shadow-xl">
                      <div className="flex items-center gap-3 mb-6">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{loadingText}</span>
                      </div>
                      <div className="whitespace-pre-wrap font-serif text-[16px] text-slate-600 leading-relaxed">
                        {rawOutput.replace(/\[MARKED_START\]|\[MARKED_END\]|\[TABLE_START\]|\[TABLE_END\]|\[REPORT_START\]|\[REPORT_END\]/g, '')}
                      </div>
                    </Card>
                  )}

                  {parsedData.reportData && (
                    <>
                      {parsedData.markedText && (
                        <Card className="p-8 md:p-12 rounded-[3.5rem] border-slate-100 shadow-xl bg-white relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-6 opacity-[0.05]">
                            <SearchCheck className="w-20 h-20" />
                          </div>
                          <div className="flex items-center gap-3 mb-8 px-2">
                            <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center">
                              <Eye className="w-5 h-5 text-pink-500" />
                            </div>
                            <span className="text-[11px] font-black text-pink-700 uppercase tracking-widest">VĂN BẢN ĐÃ HIỆU ĐÍNH (TRỰC QUAN)</span>
                          </div>
                          <div className="bg-[#FFFFFC] border border-pink-50 rounded-3xl p-8 md:p-12 font-serif text-[18px] md:text-[20px] text-slate-800 leading-[2.2] whitespace-pre-wrap shadow-inner min-h-[400px]">
                            {parsedData.markedText}
                          </div>
                          <div className="mt-6 flex items-center gap-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-red-100 border border-red-200 rounded-sm"></div>
                              <span className="text-[9px] font-black text-slate-400 uppercase">Lỗi đã đánh dấu</span>
                            </div>
                            <p className="text-[10px] text-slate-400 italic">Chú ý: Các lỗi được chuyên gia đánh dấu trực tiếp để bạn dễ dàng nhận diện và chỉnh sửa.</p>
                          </div>
                        </Card>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-6">
                        <Card className="sm:col-span-1 lg:col-span-2 p-6 md:p-8 rounded-3xl md:rounded-[40px] flex flex-col items-center justify-center text-center gap-2 border-slate-100 shadow-lg shadow-slate-100/50">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-red-50 rounded-xl md:rounded-2xl flex items-center justify-center mb-1 md:mb-2">
                            <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-red-500" />
                          </div>
                          <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">TỔNG SỐ<br className="hidden md:block" />LỖI</span>
                          <span className="text-[36px] md:text-[48px] font-black text-slate-900 leading-none">{parsedData.reportData.total_errors}</span>
                        </Card>

                        <Card className="sm:col-span-1 lg:col-span-2 p-6 md:p-8 rounded-3xl md:rounded-[40px] flex flex-col items-center justify-center text-center gap-2 border-slate-100 shadow-lg shadow-slate-100/50">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 rounded-xl md:rounded-2xl flex items-center justify-center mb-1 md:mb-2">
                            <Medal className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
                          </div>
                          <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">XẾP LOẠI</span>
                          <span className="text-[16px] md:text-[18px] font-black text-red-600 uppercase leading-tight px-2 md:px-4">{parsedData.reportData.grade}</span>
                        </Card>

                        <Card className="sm:col-span-2 lg:col-span-8 p-6 md:p-8 lg:p-12 rounded-3xl md:rounded-[48px] flex flex-col justify-center gap-4 border-slate-100 shadow-xl shadow-slate-200/20 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                            <Quote className="w-24 h-24 md:w-40 md:h-40" />
                          </div>
                          <div className="flex items-center gap-3 relative z-10">
                            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                              <School className="w-5 h-5 text-purple-600" />
                            </div>
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">GÓC NHÌN CHUYÊN GIA HIỆN TẠI</span>
                          </div>
                          <p className="text-[20px] font-bold text-slate-800 italic font-serif leading-relaxed pr-10">
                            "{parsedData.reportData.expert_summary}"
                          </p>
                        </Card>
                      </div>

                      <Card className="p-6 md:p-10 lg:p-16 rounded-3xl md:rounded-[4rem] border-slate-100 shadow-2xl shadow-blue-100/10 space-y-8 md:space-y-12 bg-white/80 backdrop-blur-sm">
                        <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-4">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200 shrink-0">
                            <BookOpenCheck className="w-5 h-5 md:w-6 md:h-6 text-white" />
                          </div>
                          <h3 className="text-[16px] md:text-[20px] font-black text-slate-800 uppercase tracking-tight">PHÂN TÍCH HIỆU ĐÍNH</h3>
                        </div>

                        <div className="space-y-4 md:space-y-8">
                          <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 space-y-3 md:space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              </div>
                              <span className="text-[11px] md:text-[12px] font-black text-emerald-700 uppercase tracking-widest">ƯU ĐIỂM SÁNG GIÁ</span>
                            </div>
                            <p className="text-[15px] md:text-[16px] font-medium text-slate-700 leading-relaxed font-serif md:pl-11">
                              {parsedData.reportData.detailed_insights.strengths}
                            </p>
                          </div>

                          <div className="bg-red-50/50 border border-red-100 rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 space-y-3 md:space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                                <MessageSquareWarning className="w-4 h-4 text-red-600" />
                              </div>
                              <span className="text-[11px] md:text-[12px] font-black text-red-700 uppercase tracking-widest">HẠN CHẾ CẦN LƯU Ý</span>
                            </div>
                            <p className="text-[15px] md:text-[16px] font-medium text-slate-700 leading-relaxed font-serif md:pl-11">
                              {parsedData.reportData.detailed_insights.weaknesses}
                            </p>
                          </div>

                          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 space-y-3 md:space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                <Lightbulb className="w-4 h-4 text-blue-600" />
                              </div>
                              <span className="text-[11px] md:text-[12px] font-black text-blue-700 uppercase tracking-widest">LỜI KHUYÊN NÂNG TẦM</span>
                            </div>
                            <p className="text-[15px] md:text-[16px] font-medium text-slate-700 leading-relaxed font-serif md:pl-11">
                              {parsedData.reportData.elevation_advice}
                            </p>
                          </div>

                          {parsedData.reportData.formatting_analysis && (
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 space-y-4 md:space-y-6">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-slate-200 rounded-xl flex items-center justify-center shrink-0">
                                    <Layout className="w-4 h-4 text-slate-600" />
                                  </div>
                                  <span className="text-[11px] md:text-[12px] font-black text-slate-700 uppercase tracking-widest">PHÂN TÍCH THỂ THỨC (NĐ 30)</span>
                                </div>
                                <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest self-start sm:self-auto ${parsedData.reportData.formatting_analysis.status === 'Đạt' ? 'bg-emerald-100 text-emerald-700' :
                                  parsedData.reportData.formatting_analysis.status === 'Không đạt' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                  }`}>
                                  {parsedData.reportData.formatting_analysis.status}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pl-11">
                                <div className="space-y-3">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CÁC VẤN ĐỀ PHÁT HIỆN</span>
                                  <ul className="space-y-2">
                                    {parsedData.reportData.formatting_analysis.issues.map((issue: string, idx: number) => (
                                      <li key={idx} className="text-[14px] text-slate-600 font-serif flex gap-2">
                                        <span className="text-red-400">•</span> {issue}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="space-y-3">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ĐỀ XUẤT CHỈNH SỬA</span>
                                  <ul className="space-y-2">
                                    {parsedData.reportData.formatting_analysis.recommendations.map((rec: string, idx: number) => (
                                      <li key={idx} className="text-[14px] text-slate-600 font-serif flex gap-2">
                                        <span className="text-blue-400">→</span> {rec}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    </>
                  )}
                </div>
              )}

              {activePreset === 'ocr' && (parsedData.ocrText || rawOutput) && (
                <div className="bg-white p-6 md:p-12 rounded-3xl md:rounded-[48px] border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-4 md:mb-6 px-2 md:px-4">
                    <FileType className="w-5 h-5 text-blue-600" />
                    <span className="text-[10px] md:text-[11px] font-black text-blue-700 uppercase tracking-widest">KẾT QUẢ TRÍCH XUẤT VĂN BẢN</span>
                  </div>
                  <div className="bg-[#FFFFFC] border border-slate-100 rounded-2xl md:rounded-3xl p-6 md:p-10 font-serif text-[16px] md:text-[18px] text-slate-800 leading-[2] whitespace-pre-wrap min-h-[500px] overflow-x-auto">
                    {parsedData.ocrText || rawOutput}
                  </div>
                </div>
              )}

              {activePreset === 'rewrite' && (parsedData.rewriteText || rawOutput) && (
                <div className="animate-in fade-in zoom-in-95 duration-700 space-y-6 md:space-y-10">
                  <div className={rewriteStyle === 'skkn' ? "w-full" : "grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10"}>
                    {rewriteStyle !== 'skkn' && (
                      <div className="bg-white border border-slate-100 rounded-3xl md:rounded-[40px] p-6 md:p-10 font-serif text-[16px] text-slate-400 italic shadow-sm md:h-[600px] overflow-y-auto custom-scrollbar relative">
                        <div className="sticky top-0 bg-white/90 backdrop-blur-sm pb-4 mb-4 flex items-center gap-2">
                          <FileText className="w-4 h-4 opacity-30 shrink-0" />
                          <span className="text-[9px] font-black uppercase text-slate-300">VĂN BẢN GỐC</span>
                        </div>
                        <Quote className="w-8 h-8 mb-6 opacity-10 text-slate-900" />
                        <div className="whitespace-pre-wrap">{fileData?.rawText || "Dữ liệu nguồn..."}</div>
                      </div>
                    )}
                    <div className={`bg-white border-2 border-blue-50 shadow-2xl shadow-blue-100/10 rounded-3xl md:rounded-[40px] p-6 md:p-10 font-serif text-[17px] md:text-[19px] text-slate-900 leading-[1.8] ${rewriteStyle === 'skkn' ? 'min-h-[600px] md:min-h-[800px]' : 'md:h-[600px]'} overflow-y-auto custom-scrollbar relative`}>
                      <div className="sticky top-0 bg-white/90 backdrop-blur-sm pb-4 mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
                          <span className="text-[9px] font-black uppercase text-blue-600">PHIÊN BẢN BIÊN TẬP</span>
                        </div>
                        {rewriteStyle === 'skkn' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white border-none text-[10px] font-black px-4 h-8 shadow-lg shadow-blue-200/50 transition-all active:scale-95"
                            onClick={() => exportToDocx(parsedData.rewriteText || rawOutput, "Don_Yeu_Cau_Cong_Nhan_Sang_Kien")}
                          >
                            <Download className="w-3 h-3 mr-2" /> TẢI SKKN (.DOCX)
                          </Button>
                        )}
                      </div>
                      <div className="markdown-body">
                        {showDiff && status !== AppStatus.LOADING ? (
                          <DiffView oldText={fileData?.rawText || ""} newText={parsedData.rewriteText || rawOutput} />
                        ) : (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {parsedData.rewriteText || rawOutput.replace(/\*\*/g, "")}
                          </ReactMarkdown>
                        )}
                      </div>
                    </div>
                  </div>
                  {parsedData.rewriteExplanation && (
                    <Card className="p-10 rounded-[3rem] border-slate-100 bg-slate-50/50">
                      <div className="flex items-center gap-3 mb-4">
                        <Info className="w-5 h-5 text-blue-500" />
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">LƯU Ý BIÊN TẬP</span>
                      </div>
                      <p className="text-[15px] font-medium text-slate-600 font-serif leading-relaxed italic">{parsedData.rewriteExplanation}</p>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="h-16 bg-white border-t border-slate-50 flex items-center justify-center gap-6">
          <PeachBlossom className="w-5 h-5" />
          <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase">TRƯỜNG TH&THCS BÃI THƠM 1994 - 2026</p>
          <ApricotBlossom className="w-5 h-5" />
        </footer>
      </main>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
        .font-serif { font-family: 'Crimson Pro', serif; }
        input::placeholder, textarea::placeholder { font-weight: 500; color: #CBD5E1; }
        
        .markdown-body table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
          font-size: 14px;
        }
        .markdown-body th, .markdown-body td {
          border: 1px solid #E2E8F0;
          padding: 8px 12px;
          text-align: left;
        }
        .markdown-body th {
          background-color: #F8FAFC;
          font-weight: 700;
        }
        .markdown-body tr:nth-child(even) {
          background-color: #F1F5F9;
        }
      `}} />
    </div>
  );
};

export default App;
