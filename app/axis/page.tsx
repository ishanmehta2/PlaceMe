import Axis from '../components/Axis'
import Token from '../components/Token'

export default function AxisPreview() {
  const teamTokens = [
    { id: '1', name: 'Alice', x: 0.7, y: 0.3, color: '#EF4444', imageUrl: 'https://randomuser.me/api/portraits/women/44.jpg' },
    { id: '2', name: 'Bob', x: -0.4, y: 0.8, color: '#3B82F6', imageUrl: 'https://randomuser.me/api/portraits/men/45.jpg' },
    { id: '3', name: 'Charlie', x: -0.6, y: -0.5, color: '#10B981', imageUrl: 'https://randomuser.me/api/portraits/men/46.jpg' },
    { id: '4', name: 'Diana', x: 0.2, y: -0.7, color: '#F59E0B', imageUrl: 'https://randomuser.me/api/portraits/women/47.jpg' },
  ]

  const personalityTokens = [
    { id: '1', name: 'John', x: 0.8, y: 0.6, color: '#8B5CF6', imageUrl: 'https://randomuser.me/api/portraits/men/48.jpg' },
    { id: '2', name: 'Sarah', x: -0.3, y: 0.4, color: '#EC4899', imageUrl: 'https://randomuser.me/api/portraits/women/49.jpg' },
    { id: '3', name: 'Mike', x: -0.7, y: -0.2, color: '#14B8A6', imageUrl: 'https://randomuser.me/api/portraits/men/50.jpg' },
  ]

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8">Axis Component Preview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Default Axis */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Default Axis</h2>
          <Axis
            labels={{
              top: "High Energy",
              bottom: "Low Energy",
              left: "Introvert",
              right: "Extrovert"
            }}
          />
        </div>

        {/* With Team Tokens */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Team Distribution</h2>
          <Axis
            labels={{
              top: "Creative",
              bottom: "Analytical",
              left: "Practical",
              right: "Theoretical"
            }}
            labelColors={{
              top: '#A7F3D0',
              bottom: '#FCA5A5',
              left: '#FDE68A',
              right: '#BFDBFE',
            }}
            tokens={teamTokens}
            tokenSize={35}
            size={300}
          />
        </div>

        {/* Larger Size with Tokens */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Personality Types</h2>
          <Axis
            labels={{
              top: "Fast",
              bottom: "Slow",
              left: "Simple",
              right: "Complex"
            }}
            size={300}
            tokenSize={56}
            tokens={personalityTokens}
          />
        </div>

        {/* Independent Tokens */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Independent Tokens</h2>
          <div className="relative w-[300px] h-[300px] bg-gray-50 rounded-lg flex flex-col items-center justify-center">
            <Token
              id="michael"
              name="Michael"
              x={0}
              y={0}
              color="#4F46E5"
              size={120}
              imageUrl="https://randomuser.me/api/portraits/men/32.jpg"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
