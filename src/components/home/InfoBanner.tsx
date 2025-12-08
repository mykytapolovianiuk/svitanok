export default function InfoBanner() {
  const features = [
    {
      id: '1',
      title: 'РЕКОМЕНДОВАНО',
      subtitle: 'ДЕРМАТОЛОГАМИ',
    },
    {
      id: '2',
      title: 'ПІДТВЕРДЖЕНО',
      subtitle: 'КЛІНІЧНИМИ ТЕСТУВАННЯМИ',
    },
    {
      id: '3',
      title: 'ПІДТВЕРДЖЕНІ РЕЗУЛЬТАТИ',
      subtitle: 'БОРОТЬБИ ЗІ СТАРІННЯМ',
    },
    {
      id: '4',
      title: 'ВИРОБЛЕНО',
      subtitle: 'В UA',
    },
    {
      id: '5',
      title: 'СЕРТИФІКОВАНО',
      subtitle: 'В CORP',
    },
  ];

  return (
    <section style={{ backgroundColor: 'rgba(255, 200, 140, 0.75)' }} className="py-4 md:py-6">
      <div className="container mx-auto px-4 md:px-8 max-w-[1440px]">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className="text-center px-2 md:px-4"
              style={{
                borderRight: index < features.length - 1 && index !== 1 && index !== 3 ? '1px solid #000000' : 'none',
              }}
            >
              <h3
                className="font-semibold uppercase mb-0.5 md:mb-1"
                style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: '10px',
                  color: '#000000',
                  letterSpacing: '0.5px',
                }}
              >
                {feature.title}
              </h3>
              <p
                className="uppercase leading-tight"
                style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: '9px',
                  color: '#000000',
                  letterSpacing: '0.3px',
                }}
              >
                {feature.subtitle}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
