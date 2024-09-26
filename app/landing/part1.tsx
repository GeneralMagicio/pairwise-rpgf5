import Image from 'next/image';
import TextBlock from '../components/TextBlock';

export const LandingPart1 = () => {
  return (
    <div className="flex h-[calc(0.90*100vh)] min-h-[768px] flex-col justify-center gap-40 md:flex-row md:justify-between md:gap-0">
      <div className="flex max-w-[400px] flex-col justify-center font-inter text-4xl font-bold md:max-w-[500px] sl:text-3xl">
        <TextBlock
          mainText="Use the"
          highlightText="Stars"
          description="for faster comparisons"
          highlightImage={{
            src: '/assets/images/star-vector.png',
            alt: 'Star',
            styles: 'absolute -top-7 left-2',
            width: 45,
            height: 45,
          }}
        />
      </div>
      <div className="relative w-full md:h-[650px] md:w-[750px]">
        <Image
          src="assets/images/landing-p1.svg"
          alt="landing part 1"
          width={750}
          height={650}
        />
      </div>
    </div>
  );
};
